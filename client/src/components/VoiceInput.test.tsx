import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VoiceInput } from "./VoiceInput";

// Mock the Web Speech API
const mockRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  continuous: false,
  interimResults: false,
  lang: "",
  maxAlternatives: 1,
  onstart: null,
  onresult: null,
  onerror: null,
  onend: null,
};

describe("VoiceInput Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock SpeechRecognition constructor
    (global as any).SpeechRecognition = vi.fn(() => mockRecognition);
    (global as any).webkitSpeechRecognition = vi.fn(() => mockRecognition);
  });

  it("renders microphone button when speech recognition is supported", () => {
    const mockOnTranscript = vi.fn();
    render(<VoiceInput onTranscript={mockOnTranscript} />);
    
    const micButton = screen.getByRole("button");
    expect(micButton).toBeDefined();
  });

  it("does not render when speech recognition is not supported", () => {
    // Remove speech recognition support
    delete (global as any).SpeechRecognition;
    delete (global as any).webkitSpeechRecognition;
    
    const mockOnTranscript = vi.fn();
    const { container } = render(<VoiceInput onTranscript={mockOnTranscript} />);
    
    expect(container.firstChild).toBeNull();
  });

  it("sets correct language for Arabic", () => {
    const mockOnTranscript = vi.fn();
    render(<VoiceInput onTranscript={mockOnTranscript} language="ar-SA" />);
    
    expect(mockRecognition.lang).toBe("ar-SA");
  });

  it("sets correct language for English", () => {
    const mockOnTranscript = vi.fn();
    render(<VoiceInput onTranscript={mockOnTranscript} language="en-US" />);
    
    expect(mockRecognition.lang).toBe("en-US");
  });

  it("starts recognition when microphone button is clicked", () => {
    const mockOnTranscript = vi.fn();
    render(<VoiceInput onTranscript={mockOnTranscript} />);
    
    const micButton = screen.getByRole("button");
    fireEvent.click(micButton);
    
    expect(mockRecognition.start).toHaveBeenCalled();
  });

  it("displays placeholder text when provided", () => {
    const mockOnTranscript = vi.fn();
    const placeholderText = "Click to speak";
    render(<VoiceInput onTranscript={mockOnTranscript} placeholder={placeholderText} />);
    
    expect(screen.getByText(placeholderText)).toBeDefined();
  });

  it("configures recognition with correct settings", () => {
    const mockOnTranscript = vi.fn();
    render(<VoiceInput onTranscript={mockOnTranscript} language="ar-SA" />);
    
    expect(mockRecognition.continuous).toBe(true);
    expect(mockRecognition.interimResults).toBe(true);
    expect(mockRecognition.lang).toBe("ar-SA");
    expect(mockRecognition.maxAlternatives).toBe(1);
  });
});
