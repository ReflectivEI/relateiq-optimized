import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, onChange, style, value, ...props }, ref) => {
  const innerRef = React.useRef(null)

  const setRefs = React.useCallback((node) => {
    innerRef.current = node

    if (typeof ref === "function") {
      ref(node)
      return
    }

    if (ref) {
      ref.current = node
    }
  }, [ref])

  const resizeTextarea = React.useCallback((node) => {
    if (!node) return
    node.style.height = "0px"
    node.style.height = `${node.scrollHeight}px`
  }, [])

  React.useLayoutEffect(() => {
    resizeTextarea(innerRef.current)
  }, [resizeTextarea, value])

  const handleChange = React.useCallback((event) => {
    resizeTextarea(event.currentTarget)
    onChange?.(event)
  }, [onChange, resizeTextarea])

  return (
    (<textarea
      className={cn(
        className,
        "flex min-h-[72px] w-full resize-none overflow-hidden !border-0 !bg-transparent px-0 py-2 text-[15px] leading-6 !shadow-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
      )}
      ref={setRefs}
      onChange={handleChange}
      style={{ ...style, overflowY: "hidden" }}
      value={value}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
