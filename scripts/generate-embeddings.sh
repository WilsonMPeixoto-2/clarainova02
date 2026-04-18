#!/usr/bin/env bash
set -euo pipefail

# Generate embeddings for all active documents with pending chunks.
# Uses `supabase functions invoke` which handles service_role auth automatically.

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

SUPABASE_URL="https://jasqctuzeznwdtbcuixn.supabase.co"
BATCH_SIZE=10
TOTAL_EMBEDDED=0
TOTAL_FAILED=0

# Document list: id|name|total_pending_chunks
DOCUMENTS=(
  "2ab139c7-5cf8-48ae-9ff8-d3ecc153e0ed|Guia do usuário interno – SEI.Rio (versão final consolidada)|116"
  "8ce173dc-2d62-4518-8052-7bdf22d8860d|Resolucao CVL nº 237 de 19 de novembro de 2025|70"
  "0bcd641f-4eb7-4b98-9920-e58ad757ca13|Termo de Uso e Aviso de Privacidade do SEI.Rio|39"
  "65388ff5-2708-4456-91fb-a582f4bc8a2b|Decreto Rio nº 57.250 de 19 de novembro de 2025|24"
  "0e2ccf22-c5b5-49c4-9012-5828c2627490|Manual do Usuário SEI 4.0+|7"
  "e6028b3a-a27e-46c3-8053-a286169e6384|Guia de migracao – SEI.Rio|5"
  "18de3ce3-0cf1-4d0a-b6d7-fe68ffe29d0d|Guia do usuario externo – SEI.Rio|4"
  "d988f50a-bcf4-433f-bea0-eddf926087c8|Novidades da versão 4.1 – Wiki SEI-RJ|4"
  "62606bcc-2ccb-45bd-b388-eb69a358acc0|Decreto Rio nº 55.615 de 1º de janeiro de 2025|3"
  "35aa4364-4c3a-418c-bcbb-f890a11e28a5|Nota oficial MGI sobre a versão 4.1.5 do SEI|3"
  "8dbb84a5-3878-4b4b-945b-f28ad104536a|Nota oficial MGI sobre o SEI 5.0.3|3"
  "85a46f4e-b36c-413c-8fc2-de0ec6566369|Documentação de apoio do SEI/PEN|3"
  "d9583127-10d7-42fa-bfd2-1767bc79c0de|Perguntas frequentes do servidor – SEI.Rio|2"
  "0c4e379f-f619-42b3-ace2-6270e52c06a0|Painel de compatibilidade de versões do SEI com módulos do PEN|2"
  "3d69e9b2-552a-4d0b-b623-3781af7a3b95|Nota oficial MGI sobre o SEI 5.0|2"
  "5cd86b37-fd21-47e9-8382-049ff15c6368|Correspondência de Ícones SEI => SEI 4.0|1"
  "5ff36401-1f0e-4d1d-8ea1-1eaa927c35b3|Perguntas frequentes do cidadao – SEI.Rio|1"
)

echo "=== CLARA Embedding Generator ==="
echo "Documents: ${#DOCUMENTS[@]}"
echo "Batch size: $BATCH_SIZE"
echo ""

for doc_entry in "${DOCUMENTS[@]}"; do
  IFS='|' read -r DOC_ID DOC_NAME CHUNK_COUNT <<< "$doc_entry"

  echo "--- [$DOC_NAME] ($CHUNK_COUNT chunks) ---"

  for (( start=0; start<CHUNK_COUNT; start+=BATCH_SIZE )); do
    end=$((start + BATCH_SIZE))
    if [ "$end" -gt "$CHUNK_COUNT" ]; then
      end=$CHUNK_COUNT
    fi
    batch_size=$((end - start))

    echo -n "  Batch $start..$((end-1)) ($batch_size chunks)... "

    # Build chunks array: fetch content from DB via supabase SQL,
    # then pass structured objects to the Edge Function
    CHUNKS_JSON=$(supabase db query \
      --project-ref jasqctuzeznwdtbcuixn \
      --output json \
      "SELECT content, page_start, page_end, section_title FROM document_chunks WHERE document_id = '$DOC_ID' AND chunk_index >= $start AND chunk_index < $end ORDER BY chunk_index" 2>/dev/null \
      | python3 -c "
import sys, json
rows = json.load(sys.stdin)
chunks = []
for r in rows:
    chunks.append({
        'content': r['content'],
        'pageStart': r.get('page_start'),
        'pageEnd': r.get('page_end'),
        'sectionTitle': r.get('section_title')
    })
print(json.dumps(chunks))
" 2>/dev/null)

    if [ -z "$CHUNKS_JSON" ] || [ "$CHUNKS_JSON" = "[]" ]; then
      echo "SKIP (no chunks)"
      continue
    fi

    PAYLOAD=$(python3 -c "
import json, sys
chunks = json.loads('''$CHUNKS_JSON''')
payload = {
    'document_id': '$DOC_ID',
    'chunks': chunks,
    'start_index': $start,
    'title': '''$DOC_NAME'''
}
print(json.dumps(payload))
" 2>/dev/null)

    RESULT=$(echo "$PAYLOAD" | supabase functions invoke embed-chunks \
      --project-ref jasqctuzeznwdtbcuixn \
      --no-verify-jwt \
      2>/dev/null) || RESULT='{"ok":false,"error":"INVOKE_FAILED"}'

    OK=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ok',''))" 2>/dev/null || echo "")
    SAVED=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('saved',0))" 2>/dev/null || echo "0")
    FAILED=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('failed_embeddings',0))" 2>/dev/null || echo "0")

    if [ "$OK" = "True" ]; then
      echo "OK (saved=$SAVED, failed=$FAILED)"
      TOTAL_EMBEDDED=$((TOTAL_EMBEDDED + SAVED))
      TOTAL_FAILED=$((TOTAL_FAILED + FAILED))
    else
      ERROR=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error','unknown'))" 2>/dev/null || echo "unknown")
      echo "FAIL ($ERROR)"
      TOTAL_FAILED=$((TOTAL_FAILED + batch_size))
    fi

    # Rate limit: small pause between batches
    sleep 1
  done

  echo ""
done

echo "=== DONE ==="
echo "Total embedded: $TOTAL_EMBEDDED"
echo "Total failed: $TOTAL_FAILED"
