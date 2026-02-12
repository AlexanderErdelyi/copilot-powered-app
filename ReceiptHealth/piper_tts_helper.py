#!/usr/bin/env python3
"""
Edge TTS Helper Script  
Generates speech using Microsoft Edge TTS (neural voices, no models needed!)
"""
import sys
import asyncio

async def generate_speech(text, output_file, voice="en-US-AriaNeural"):
    try:
        import edge_tts
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_file)
        
        print(f"Success: Generated {output_file} with voice {voice}")
        return 0
        
    except ImportError as e:
        print(f"Error: edge-tts not installed: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Error generating speech: {e}", file=sys.stderr)
        return 1

def main():
    if len(sys.argv) < 3:
        print("Usage: python piper_tts_helper.py <text> <output_wav_file> [voice]", file=sys.stderr)
        sys.exit(1)
    
    text = sys.argv[1]
    output_file = sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else "en-US-AriaNeural"
    
    # Run async function
    result = asyncio.run(generate_speech(text, output_file, voice))
    sys.exit(result)

if __name__ == "__main__":
    main()
