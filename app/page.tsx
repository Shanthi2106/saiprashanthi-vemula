  'use client';
  import { useChat } from '@ai-sdk/react';
  import { useState } from 'react';
  import Image from 'next/image';


  export default function Chat() {
    const [input, setInput] = useState('');
    const { messages, sendMessage } = useChat();
    
    // Generate falling leaves for the background
    const leaves = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${(i * 7) % 100}%`,
      delay: `${(i * 0.3) % 10}s`,
      speed: ['slow', 'medium', 'fast'][i % 3],
      type: ['orange', 'red', 'yellow'][i % 3],
    }));

    return (
      <>
        {/* Falling leaves background - full screen */}
        <div className="fixed inset-0 w-screen h-screen pointer-events-none z-0">
          {leaves.map((leaf) => (
            <div
              key={leaf.id}
              className={`falling-leaf falling-leaf-${leaf.speed}`}
              style={{
                left: leaf.left,
                animationDelay: leaf.delay,
              }}
            >
              <Image 
                src={`/leaf-${leaf.type}.svg`} 
                alt="Falling leaf" 
                width={40} 
                height={40} 
                className="opacity-60"
              />
            </div>
          ))}
        </div>
        
        <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch bg-gradient-to-b from-purple-950 via-black to-orange-950 dark:from-purple-950 dark:via-black dark:to-orange-950 min-h-screen relative overflow-hidden">
          {/* Background decorative images */}
          <div className="absolute top-4 left-4 opacity-20 animate-pulse z-10">
            <Image src="/pumpkin.svg" alt="Pumpkin" width={60} height={60} />
          </div>
          <div className="absolute top-8 right-8 opacity-20 animate-pulse z-10" style={{ animationDelay: '1s' }}>
            <Image src="/ghost.svg" alt="Ghost" width={50} height={50} />
          </div>
          <div className="absolute bottom-32 left-8 opacity-20 animate-pulse z-10" style={{ animationDelay: '1.5s' }}>
            <Image src="/bat.svg" alt="Bat" width={50} height={50} />
          </div>
          <div className="absolute top-1/2 right-4 opacity-15 z-10">
            <Image src="/spider-web.svg" alt="Spider Web" width={80} height={80} />
          </div>
          
          <div className="relative z-10">
          {messages.map(message => (
            <div key={message.id} className="whitespace-pre-wrap mb-4 p-4 rounded-lg bg-black/60 dark:bg-black/70 backdrop-blur-sm border-2 border-orange-600/50 shadow-lg shadow-orange-500/20">
              <span className={`font-bold text-lg ${
                message.role === 'user' 
                  ? 'text-orange-400 dark:text-orange-300' 
                  : 'text-purple-400 dark:text-purple-300'
              }`}>
                {message.role === 'user' ? '🎃 User: ' : '👻 Ghost: '}
              </span>
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    return <span key={`${message.id}-${i}`} className="text-orange-100 dark:text-orange-50">{part.text}</span>;
                }
              })}
            </div>
          ))}
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            sendMessage({ text: input });
            setInput('');
          }}
          className="relative z-10"
        >
          <div className="flex items-center gap-2 fixed bottom-0 w-full max-w-md mb-8">
            <Image src="/pumpkin.svg" alt="Pumpkin" width={32} height={32} className="opacity-80" />
            <input
              className="w-full bg-gradient-to-r from-orange-900 via-black to-purple-900 dark:from-orange-900 dark:via-black dark:to-purple-900 p-3 border-2 border-orange-500 dark:border-orange-600 rounded-lg shadow-2xl shadow-orange-500/50 text-orange-100 dark:text-orange-50 placeholder:text-orange-400 dark:placeholder:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500 font-semibold"
              value={input}
              placeholder="Trick or treat..."
              onChange={e => setInput(e.currentTarget.value)}
            />
            <Image src="/ghost.svg" alt="Ghost" width={32} height={32} className="opacity-80" />
          </div>
        </form>
        </div>
      </>
    );
  }