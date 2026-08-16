import React from 'react'

export function JsonViewer({ data }: { data: unknown }) {
  const jsonString = JSON.stringify(data, null, 2)

  // A regex to tokenize JSON for syntax highlighting
  const colorized = jsonString
    // Escape HTML brackets in the JSON string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-[#A5D6FF]' // string value
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-[#7EE787]' // key
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-[#FF7B72]' // boolean
        } else if (/null/.test(match)) {
          cls = 'text-[#8B949E]' // null
        } else {
          cls = 'text-[#79C0FF]' // number
        }
        return `<span class="${cls}">${match}</span>`
      }
    )

  return (
    <div className="w-full h-full overflow-auto bg-[#0D1117] p-5">
      <pre 
        className="font-mono text-[12px] leading-[1.6] text-[#C9D1D9] m-0"
        dangerouslySetInnerHTML={{ __html: colorized }} 
      />
    </div>
  )
}
