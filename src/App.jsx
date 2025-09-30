import React, { useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import { FloatingMenu, BubbleMenu } from "@tiptap/react/menus"; 
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Highlight from "@tiptap/extension-highlight"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import jsPDF from "jspdf"

// -------------------- UI Components --------------------
const Button = ({ onClick, disabled, variant = "default", children, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-4 py-2 rounded-md font-medium transition-colors
      ${variant === "default" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
      ${variant === "outline" ? "border border-gray-300 bg-white hover:bg-gray-50" : ""}
      ${variant === "success" ? "bg-green-600 text-white hover:bg-green-700" : ""}
      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    `}
    {...props}
  >
    {children}
  </button>
)

const Card = ({ children, className = "" }) => (
  <div className={`bg-white shadow-sm ${className}`}>{children}</div>
)

const CardHeader = ({ children }) => <div className="p-6 pb-4">{children}</div>
const CardTitle = ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>
const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
)

// -------------------- Main App --------------------
export default function App() {
  const [sections, setSections] = useState([
    "Section 1: Start by asking about the first topic...",
    "Section 2: This section is waiting for your input...",
    "Section 3: Final section content will appear here...",
  ])
  const [currentStep, setCurrentStep] = useState(0)
  const [conversations, setConversations] = useState([])
  const [userInput, setUserInput] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  // ✅ TipTap Config
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "Start writing or edit AI response here...",
      }),
    ],
    content: sections[currentStep],
    autofocus: true,
    editable: true,
    injectCSS: true,
    onUpdate: ({ editor }) => {
      const updated = [...sections]
      updated[currentStep] = editor.getHTML()
      setSections(updated)
    },
  })

  // -------------------- AI Response (Simulated) --------------------
  const getAIResponse = async (userMessage, sectionNumber) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const responses = {
      0: `<b>Definition for Section 1:</b><br/><br/>Based on your query "${userMessage}", here is a comprehensive definition.`,
      1: `<b>Explanation for Section 2:</b><br/><br/>For your question "${userMessage}", here is the detailed explanation.`,
      2: `<b>Final Analysis for Section 3:</b><br/><br/>Regarding "${userMessage}", here is the complete analysis.`,
    }
    return responses[sectionNumber] || "Let me help you with that."
  }

  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    const userMessage = { type: "user", content: userInput }
    setConversations((prev) => [...prev, userMessage])
    setUserInput("")

    const aiResponse = await getAIResponse(userInput, currentStep)
    const aiMessage = { type: "ai", content: aiResponse }
    setConversations((prev) => [...prev, aiMessage])

    const updatedSections = [...sections]
    updatedSections[currentStep] = aiResponse
    setSections(updatedSections)

    editor?.commands.setContent(aiResponse)
  }

  const nextSection = () => {
    if (currentStep < sections.length - 1) {
      setCurrentStep(currentStep + 1)
      editor?.commands.setContent(sections[currentStep + 1])
    }
  }

  const prevSection = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      editor?.commands.setContent(sections[currentStep - 1])
    }
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    let yPosition = 20

    sections.forEach((section, index) => {
      const cleanText = section.replace(/<[^>]+>/g, "")
      const sectionText = `Section ${index + 1}:\n${cleanText}`
      const lines = doc.splitTextToSize(sectionText, 180)

      if (yPosition + lines.length * 7 > 280) {
        doc.addPage()
        yPosition = 20 
      }

      doc.text(lines, 10, yPosition)
      yPosition += lines.length * 7 + 10
    })

    doc.save("ZenAI_Output.pdf")
  }


  const togglePreview = () => setShowPreview(!showPreview)
  const hasStarted = conversations.length > 0

  // -------------------- Toolbar --------------------
  const MenuBar = () => {
    if (!editor) return null
    return (
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 mb-2">
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          variant={editor.isActive("bold") ? "success" : "outline"}
        >
          Bold
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          variant={editor.isActive("italic") ? "success" : "outline"}
        >
          Italic
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          variant={editor.isActive("underline") ? "success" : "outline"}
        >
          Underline
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          variant={editor.isActive("bulletList") ? "success" : "outline"}
        >
          • List
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          variant={editor.isActive("orderedList") ? "success" : "outline"}
        >
          1. List
        </Button>
        <Button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          variant={editor.isActive({ textAlign: "left" }) ? "success" : "outline"}
        >
          Left
        </Button>
        <Button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          variant={editor.isActive({ textAlign: "center" }) ? "success" : "outline"}
        >
          Center
        </Button>
        <Button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          variant={editor.isActive({ textAlign: "right" }) ? "success" : "outline"}
        >
          Right
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          variant={editor.isActive("highlight") ? "success" : "outline"}
        >
          Highlight
        </Button>
      </div>
    )
  }

  // -------------------- UI Layout --------------------
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50">
      <div
        className={`flex gap-6 w-full h-screen transition-all duration-300 ${
          hasStarted ? "flex-row" : "flex-col items-center"
        }`}
      >
        {/* Left - Chat */}
        <Card className={`flex flex-col h-full ${hasStarted ? "w-[40%]" : "w-full"}`}>
          <CardHeader>
            <CardTitle>Section {currentStep + 1} - Conversation</CardTitle>
          </CardHeader>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
            {conversations.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Ask a question about Section {currentStep + 1} to get started...
              </div>
            ) : (
              conversations.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg max-w-[80%] text-sm ${
                      msg.type === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <span dangerouslySetInnerHTML={{ __html: msg.content }} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input area */}
          <div className="px-6 py-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`Ask about Section ${currentStep + 1}...`}
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} variant="default">
                Send
              </Button>
            </div>
          </div>
        </Card>

        {/* Right - AI Response */}
        {hasStarted && (
          <Card className="h-full w-[60%] shadow-lg flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {showPreview ? "Final Preview" : `Section ${currentStep + 1} Response`}
                </CardTitle>
                {showPreview && (
                  <Button onClick={exportPDF} variant="success" size="sm">
                    Download PDF
                  </Button>
                )}
              </div>
            </CardHeader>

            {/* Scrollable content */}
            <CardContent className="flex-1 overflow-y-auto">
              {showPreview ? (
                <div className="space-y-6">
                  {sections.map((section, index) => (
                    <div key={index}>
                      <h3 className="text-lg font-semibold mb-2">
                        Section {index + 1}
                      </h3>
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: section }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 relative">
                  <MenuBar />
                  <EditorContent
                    className="prose max-w-none focus:outline-none"
                    editor={editor}
                  />
                  {editor && (
                    <>
                      <FloatingMenu
                        editor={editor}
                        className="bg-white shadow-md p-2 rounded-md"
                      >
                        Floating Menu
                      </FloatingMenu>
                      <BubbleMenu
                        editor={editor}
                        className="bg-white shadow-md p-2 rounded-md"
                      >
                        <button
                          onClick={() => editor.chain().focus().toggleBold().run()}
                          className="px-2 py-1 border rounded"
                        >
                          B
                        </button>
                        <button
                          onClick={() => editor.chain().focus().toggleItalic().run()}
                          className="px-2 py-1 border rounded ml-1"
                        >
                          I
                        </button>
                        <button
                          onClick={() => editor.chain().focus().toggleUnderline().run()}
                          className="px-2 py-1 border rounded ml-1"
                        >
                          U
                        </button>
                      </BubbleMenu>
                    </>
                  )}
                </div>
              )}
            </CardContent>

            {/* Sticky footer navigation */}
            <div className="px-6 py-4 bg-white mt-auto">
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={prevSection}
                  disabled={currentStep === 0}
                  variant="outline"
                >
                  ← Previous
                </Button>
                <Button
                  onClick={nextSection}
                  disabled={currentStep === sections.length - 1}
                  variant="default"
                >
                  Next → 
                </Button>
                <Button onClick={togglePreview} variant="outline">
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
