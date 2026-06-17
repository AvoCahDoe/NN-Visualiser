import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

interface MathBlockProps {
  formula: string;
  className?: string;
}

export function MathBlock({ formula, className = '' }: MathBlockProps) {
  if (!formula?.trim()) return null;

  let html: string;
  try {
    html = katex.renderToString(formula, {
      displayMode: true,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      output: 'html',
    });
  } catch {
    html = `<span class="katex-error">${formula}</span>`;
  }

  return (
    <div
      className={cn('math-block', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
