import React, { useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import jsPDF from 'jspdf'

// UI Components
const Button = ({ onClick, disabled, variant = 'default', children, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-4 py-2 rounded-md font-medium transition-colors
      ${variant === 'default' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
      ${variant === 'outline' ? 'border border-gray-300 bg-white hover:bg-gray-50' : ''}
      ${variant === 'success' ? 'bg-green-600 text-white hover:bg-green-700' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
    {...props}
  >
    {children}
  </button>
)

const Card = ({ children, className = '' }) => (
  <div className={`border rounded-lg bg-white shadow-sm ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children }) => <div className="p-6 pb-4">{children}</div>
const CardTitle = ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>
const CardContent = ({ children }) => <div className="p-6 pt-0">{children}</div>

export default function App() {
  const [sections, setSections] = useState([
    "Section 1: Start by asking about the first topic...",
    "Section 2: This section is waiting for your input...", 
    "Section 3: Final section content will appear here..."
  ])
  const [currentStep, setCurrentStep] = useState(0)
  const [conversations, setConversations] = useState([]) // Single conversation for all steps
  const [userInput, setUserInput] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: sections[currentStep],
    onUpdate: ({ editor }) => {
      const updated = [...sections]
      updated[currentStep] = editor.getHTML()
      setSections(updated)
    },
  })

  // Simulate AI response
  const getAIResponse = async (userMessage, sectionNumber) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const responses = {
      0: `**Definition for Section 1:**\n\nBased on your query "${userMessage}", here is a comprehensive definition.`,
      1: `**Explanation for Section 2:**\n\nFor your question "${userMessage}", here is the detailed explanation.`,
      2: `**Final Analysis for Section 3:**\n\nRegarding "${userMessage}", here is the complete analysis.`
    }
    return responses[sectionNumber] || "Let me help you with that."
  }

  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    const userMessage = { type: 'user', content: userInput }
    setConversations(prev => [...prev, userMessage])
    setUserInput("")

    const aiResponse = await getAIResponse(userInput, currentStep)
    const aiMessage = { type: 'ai', content: aiResponse }
    setConversations(prev => [...prev, aiMessage])

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

      if (yPosition + (lines.length * 7) > 280) {
        doc.addPage()
        yPosition = 20
      }

      doc.text(lines, 10, yPosition)
      yPosition += (lines.length * 7) + 10
    })

    doc.save('ZenAI_Output.pdf')
  }

  const togglePreview = () => setShowPreview(!showPreview)
  const hasStarted = conversations.length > 0

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className={`flex gap-6 w-full max-w-7xl transition-all duration-300 ${
        hasStarted ? 'flex-row' : 'flex-col items-center'
      }`}>

        {/* Left - Conversation */}
        <Card className={`w-full ${hasStarted ? 'w-1/2' : 'max-w-xl'}`}>
          <CardHeader>
            <CardTitle>Section {currentStep + 1} - Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto bg-gray-50">
              {conversations.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  Ask a question about Section {currentStep + 1} to get started...
                </div>
              ) : (
                conversations.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg mb-2 ${
                      msg.type === 'user' ? 'bg-blue-100 ml-8' : 'bg-green-100 mr-8'
                    }`}
                  >
                    <strong>{msg.type === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`Ask about Section ${currentStep + 1}...`}
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} variant="default">
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right - AI Response */}
        {hasStarted && (
          <Card className="w-1/2 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {showPreview ? 'Final Preview' : `Section ${currentStep + 1} Response`}
                </CardTitle>
                {showPreview && (
                  <Button onClick={exportPDF} variant="success" size="sm">
                    Download PDF
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="space-y-6">
                  {sections.map((section, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <h3 className="text-lg font-semibold mb-2">Section {index + 1}</h3>
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: section }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-2">
                    AI Response for Section {currentStep + 1} (Editable):
                  </div>
                  <div className="border rounded-lg p-2 min-h-[300px]">
                    <EditorContent editor={editor} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      {hasStarted && (
        <div className="flex gap-2 mt-6">
          <Button onClick={prevSection} disabled={currentStep === 0} variant="outline">
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
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
      )}
    </div>
  )
}
