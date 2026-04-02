ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read documents" ON public.documents;
DROP POLICY IF EXISTS "Public insert documents" ON public.documents;
DROP POLICY IF EXISTS "Public update documents" ON public.documents;
DROP POLICY IF EXISTS "Public delete documents" ON public.documents;

DROP POLICY IF EXISTS "Public read chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Public insert chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Public delete chunks" ON public.document_chunks;

DROP POLICY IF EXISTS "Public read usage_logs" ON public.usage_logs;
DROP POLICY IF EXISTS "Public insert usage_logs" ON public.usage_logs;

CREATE POLICY "Authenticated read documents"
ON public.documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated insert documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated update documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated delete documents"
ON public.documents
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated read chunks"
ON public.document_chunks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated insert chunks"
ON public.document_chunks
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated delete chunks"
ON public.document_chunks
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated read usage_logs"
ON public.usage_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated insert usage_logs"
ON public.usage_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

UPDATE storage.buckets
SET public = false
WHERE id = 'documents';

DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access for documents" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for documents" ON storage.objects;

CREATE POLICY "Authenticated read access for documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated upload access for documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated delete access for documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
