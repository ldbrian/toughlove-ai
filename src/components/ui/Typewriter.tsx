import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export const Typewriter = ({ content, isThinking }: { content: string, isThinking?: boolean }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  useEffect(() => {
    if (!isThinking) { setDisplayedContent(content); return; }
    if (displayedContent.length < content.length) {
      const delay = Math.random() * 30 + 20;
      const timer = setTimeout(() => { setDisplayedContent(content.slice(0, displayedContent.length + 1)); }, delay);
      return () => clearTimeout(timer);
    }
  }, [content, displayedContent, isThinking]);
  return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
};