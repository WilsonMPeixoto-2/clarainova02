import { useEffect } from "react";

interface DocumentMetaOptions {
  title: string;
  description: string;
}

function setNamedMeta(name: string, content: string) {
  let element = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setPropertyMeta(property: string, content: string) {
  let element = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

export function useDocumentMeta({ title, description }: DocumentMetaOptions) {
  useEffect(() => {
    document.title = title;
    setNamedMeta("description", description);
    setPropertyMeta("og:title", title);
    setPropertyMeta("og:description", description);
    setNamedMeta("twitter:title", title);
    setNamedMeta("twitter:description", description);
  }, [description, title]);
}
