const fs = require('fs');
let code = fs.readFileSync('supabase/functions/chat/index.ts', 'utf8');

const globals = `
const FEATURE_WEB_SEARCH = Deno.env.get('FEATURE_WEB_SEARCH') === 'true';
const OFFICIAL_WEB_DOMAINS = [
  'rio.rj.gov.br',
  'prefeitura.rio',
  'carioca.rio',
  'pcrj.rj.gov.br'
];
`;
code = code.replace('const STREAM_FALLBACK_RESERVE_MS = 1500;', 'const STREAM_FALLBACK_RESERVE_MS = 1500;\n' + globals);

code = code.replace(
  "targetBilling: 'free' | 'paid' | 'legacy';",
  "targetBilling: 'free' | 'paid' | 'legacy';\n  enableWebSearch: boolean;"
);

code = code.replace(
  "let targetBilling: 'free' | 'paid' | 'legacy' = 'legacy';",
  "let targetBilling: 'free' | 'paid' | 'legacy' = 'legacy';\n  const enableWebSearch = FEATURE_WEB_SEARCH && options.intentLabel !== 'fora_escopo' && (retrievalTier === 'fraca' || options.intentLabel === 'erro_sistema' || options.intentLabel === 'conceito');"
);

code = code.replace(
  "targetBilling,",
  "targetBilling,\n    enableWebSearch,"
);

const originalPromptSetupBlock = `    const systemPromptWithContext = \`\${SYSTEM_PROMPT}\${responseModePrompt}\${retrievalQualityPrompt}\${sourceTargetPrompt}\${knowledgeContext}\`;
    const promptTelemetry = buildPromptTelemetry({
      systemPrompt: SYSTEM_PROMPT,
      responseModePrompt,
      retrievalQualityPrompt,
      sourceTargetPrompt,
      knowledgeContext,
      messages: chatMessages,
    });
    const generationStrategy = buildGenerationStrategy({
      intentLabel,
      responseMode,
      sourceTarget,
      retrievalQuality,
      geminiFreeKey,
      geminiPaidKey,
      legacyKey,
    });`;

const newPromptSetupBlock = `    const generationStrategy = buildGenerationStrategy({
      intentLabel,
      responseMode,
      sourceTarget,
      retrievalQuality,
      geminiFreeKey,
      geminiPaidKey,
      legacyKey,
    });

    const webSearchPrompt = generationStrategy.enableWebSearch
      ? \`\\n\\nUSO DE BUSCA NA WEB AUTORIZADO:\\nSua base não contém contexto forte suficiente para fechar a dúvida com precisão cirúrgica. Você tem permissão para usar a web.\\nIMPORTANTE: Pesquise e faça uso de fatos APENAS de sites oficiais cujos domínios terminem em: \${OFFICIAL_WEB_DOMAINS.join(', ')}.\\nDescarte resultados de conselhos terceiros, blogs genéricos ou fóruns não-oficiais.\`
      : '';

    const systemPromptWithContext = \`\${SYSTEM_PROMPT}\${responseModePrompt}\${retrievalQualityPrompt}\${sourceTargetPrompt}\${knowledgeContext}\${webSearchPrompt}\`;
    const promptTelemetry = buildPromptTelemetry({
      systemPrompt: SYSTEM_PROMPT,
      responseModePrompt,
      retrievalQualityPrompt,
      sourceTargetPrompt,
      knowledgeContext,
      messages: chatMessages,
    });`;

code = code.replace(originalPromptSetupBlock, newPromptSetupBlock);

code = code.replaceAll('topP: strategy.streamTopP,', 'topP: strategy.streamTopP,\n          ...(strategy.enableWebSearch ? { tools: [{ googleSearch: {} } as any] } : {}),');
code = code.replaceAll('topP: strategy.structuredTopP,', 'topP: strategy.structuredTopP,\n          ...(strategy.enableWebSearch ? { tools: [{ googleSearch: {} } as any] } : {}),');

code = code.replaceAll('topP: 0.85,\n          thinkingConfig: {', 'topP: 0.85,\n          ...(strategy.enableWebSearch ? { tools: [{ googleSearch: {} } as any] } : {}),\n          thinkingConfig: {');

fs.writeFileSync('supabase/functions/chat/index.ts', code);
console.log('Update Complete.');
