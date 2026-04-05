-- Normalize SEI-Rio term documents so retrieval sees them as first-class official sources.

UPDATE public.documents
SET metadata_json = jsonb_strip_nulls(
  COALESCE(metadata_json, '{}'::jsonb) ||
  jsonb_build_object(
    'document_kind', 'termo'
  )
)
WHERE topic_scope = 'sei_rio_termo'
  AND COALESCE(metadata_json->>'document_kind', '') IN ('', 'apoio');
