import { useState, useRef, useCallback } from "react"

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useSpeechRecognition() {
    const [ transcript, setTranscript ] = useState("")
    const [ interimTranscript, setInterimTranscript ] = useState("")
    const [ isRecording, setIsRecording ] = useState(false)
    const [ isSupported ] = useState(() => !!SpeechRecognition)
    const recognitionRef = useRef(null)

    const startRecording = useCallback(() => {
        if (!SpeechRecognition) return

        const recognition = new SpeechRecognition()
        recognition.lang = "en-US"
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => setIsRecording(true)

        recognition.onresult = (event) => {
            let finalText = ""
            let interimText = ""
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                if (result.isFinal) {
                    finalText += result[0].transcript + " "
                } else {
                    interimText += result[0].transcript
                }
            }
            if (finalText) setTranscript(prev => prev + finalText)
            setInterimTranscript(interimText)
        }

        recognition.onerror = (e) => {
            console.error("Speech recognition error:", e.error)
            setIsRecording(false)
        }

        recognition.onend = () => {
            setIsRecording(false)
            setInterimTranscript("")
        }

        recognitionRef.current = recognition
        recognition.start()
    }, [])

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            recognitionRef.current = null
        }
        setIsRecording(false)
        setInterimTranscript("")
    }, [])

    const resetTranscript = useCallback(() => {
        setTranscript("")
        setInterimTranscript("")
    }, [])

    return { transcript, interimTranscript, isRecording, isSupported, startRecording, stopRecording, resetTranscript, setTranscript }
}
