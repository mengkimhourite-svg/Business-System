import { Bot, ExternalLink } from "lucide-react";
import { EnterpriseAIAssistant } from "../components/ai/EnterpriseAIAssistant";
import { useAIAssistant } from "../context/AIAssistantContext.jsx";

export default function EnterpriseAIDemoPage() {
  const { openPanel } = useAIAssistant();

  return (
    <div className="min-h-screen bg-[#0B1120] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6]">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Enterprise AI Assistant
            </h1>
            <p className="text-sm text-slate-400">
              Professional Business Intelligence Panel
            </p>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Features */}
          <div className="rounded-2xl bg-[#1E293B] border border-slate-700/30 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Clean Dark Theme",
                  desc: "Professional enterprise dark mode with subtle borders",
                },
                {
                  title: "AI Chat Interface",
                  desc: "Real-time messaging with typing indicators",
                },
                {
                  title: "Quick Questions",
                  desc: "One-click access to common business queries",
                },
                {
                  title: "Context Selector",
                  desc: "Switch between business modules easily",
                },
                {
                  title: "Responsive Design",
                  desc: "Desktop panel with mobile bottom sheet",
                },
                {
                  title: "Minimal & Professional",
                  desc: "Clean UI inspired by Microsoft Copilot",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-[#0B1120] border border-slate-700/20 p-4"
                >
                  <h3 className="text-sm font-medium text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Design Specs */}
          <div className="rounded-2xl bg-[#1E293B] border border-slate-700/30 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Design Specifications
            </h2>
            <div className="space-y-3">
              {[
                { label: "Panel Width", value: "400px (expandable to 480px)" },
                { label: "Theme", value: "Dark (#0B1120 background)" },
                { label: "Panel Color", value: "#0B1120 with subtle borders" },
                { label: "Card Color", value: "#1E293B for inputs & dropdowns" },
                { label: "Primary Color", value: "#3B82F6 (Blue)" },
                { label: "Typography", value: "Clean, modern, 13-14px body text" },
                { label: "Layout", value: "Left-aligned welcome, centered chat" },
              ].map((spec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-slate-700/20 last:border-0"
                >
                  <span className="text-sm text-slate-400">{spec.label}</span>
                  <span className="text-sm font-medium text-white">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Start */}
          <div className="rounded-2xl bg-[#1E293B] border border-slate-700/30 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Quick Start
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Click the button below to open the AI Assistant panel.
            </p>
            <button
              onClick={openPanel}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-medium text-white hover:bg-[#2563EB] transition-colors"
            >
              <Bot className="h-4 w-4" />
              Open AI Assistant
            </button>
          </div>

          {/* Color Palette */}
          <div className="rounded-2xl bg-[#1E293B] border border-slate-700/30 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Color Palette
            </h2>
            <div className="space-y-2">
              {[
                { name: "Background", color: "#0B1120" },
                { name: "Panel", color: "#1E293B" },
                { name: "Input", color: "#1E293B" },
                { name: "Primary", color: "#3B82F6" },
                { name: "Text Primary", color: "#FFFFFF" },
                { name: "Text Secondary", color: "#94A3B8" },
                { name: "Text Muted", color: "#64748B" },
                { name: "Border", color: "#334155" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="h-6 w-6 rounded-md border border-slate-700/30"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {item.color}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl bg-[#1E293B] border border-slate-700/30 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              How to Use
            </h2>
            <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
              <li>Click "Open AI Assistant" button</li>
              <li>View the welcome screen with greeting</li>
              <li>Use context badges for business modules</li>
              <li>Click quick question buttons for fast queries</li>
              <li>Type messages in the input field</li>
              <li>Press Enter to send your message</li>
            </ol>
          </div>
        </div>
      </div>

      {/* The Enterprise AI Assistant Panel */}
      <EnterpriseAIAssistant />
    </div>
  );
}
