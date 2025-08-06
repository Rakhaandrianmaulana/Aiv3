document.addEventListener('DOMContentLoaded', () => {
    // --- KONFIGURASI DAN VARIABEL ---
    // API Key Anda sudah dimasukkan di sini.
    const API_KEY = 'AIzaSyAg0oEzZJciZxsvihHqpo-mS7BGg0RLBEs'; 
    const GEMINI_API_URL_TEXT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-preview-0514:generateContent?key=${API_KEY}`;
    const GEMINI_API_URL_VISION = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${API_KEY}`;
    
    // DOM Elements
    const chatOutput = document.getElementById('chat-output');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const imageUploadInput = document.getElementById('image-upload');
    const sendBtn = document.getElementById('send-btn');
    const sendIcon = document.getElementById('send-icon');
    const loadingSpinner = document.getElementById('loading-spinner');
    const musicToggleBtn = document.getElementById('music-toggle-btn');
    const suggestionsContainer = document.getElementById('suggestions');

    // State Management
    let chatHistory = []; // Stores the conversation for context
    let isProcessing = false; // Prevents multiple submissions

    // Background Music
    const backgroundMusic = new Audio('https://files.catbox.moe/3yeu0x.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;
    let isMusicPlaying = false;


    // --- FUNGSI UTAMA ---

    /**
     * Menampilkan pesan di antarmuka chat
     * @param {string} message Teks pesan atau elemen HTML
     * @param {'user' | 'ai'} sender Pengirim pesan
     * @param {string|null} imageUrl URL gambar untuk ditampilkan (opsional)
     */
    const displayMessage = (message, sender, imageUrl = null) => {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `flex items-start gap-3 ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

        const messageBubble = document.createElement('div');
        messageBubble.className = `max-w-md md:max-w-lg p-3 rounded-2xl ${sender === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`;
        
        if (imageUrl) {
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.className = 'rounded-lg mb-2 max-w-xs';
            messageBubble.appendChild(imgElement);
        }
        
        // Menggunakan innerHTML untuk merender <br> dari \n
        const messageContent = document.createElement('div');
        messageContent.innerHTML = message.replace(/\n/g, '<br>');
        messageBubble.appendChild(messageContent);
        
        messageWrapper.appendChild(messageBubble);
        chatOutput.appendChild(messageWrapper);
        chatOutput.scrollTop = chatOutput.scrollHeight; // Auto-scroll to bottom
    };

    /**
     * Mengirim permintaan ke Rakha-AI (Gemini API)
     * @param {string} prompt Teks pertanyaan dari pengguna
     * @param {object|null} imageParts Bagian gambar untuk model vision
     */
    const askRakhaAI = async (prompt, imageParts = null) => {
        setProcessingState(true);
        const url = imageParts ? GEMINI_API_URL_VISION : GEMINI_API_URL_TEXT;
        
        addToHistory('user', prompt);
        
        const contents = imageParts 
            ? [{ role: "user", parts: [{ text: prompt }, imageParts] }]
            : buildHistoryPayload(prompt);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.error.message}`);
            }

            const data = await response.json();
            const aiResponse = data.candidates[0]?.content?.parts[0]?.text || "Maaf, saya tidak dapat memberikan jawaban saat ini.";
            
            displayMessage(aiResponse, 'ai');
            addToHistory('model', aiResponse);

        } catch (error) {
            console.error("Error asking Rakha-AI:", error);
            displayMessage(`Terjadi kesalahan: ${error.message}. Pastikan API Key Anda valid dan coba lagi.`, 'ai');
        } finally {
            setProcessingState(false);
        }
    };
    
    const buildHistoryPayload = (currentPrompt) => {
        const payload = [...chatHistory];
        payload.push({ role: 'user', parts: [{ text: currentPrompt }] });
        return payload.slice(-10); 
    };
    
    const addToHistory = (role, text) => {
        chatHistory.push({ role, parts: [{ text }] });
        if (chatHistory.length > 10) {
            chatHistory.shift();
        }
    };

    const setProcessingState = (state) => {
        isProcessing = state;
        sendIcon.classList.toggle('hidden', state);
        loadingSpinner.classList.toggle('hidden', !state);
        sendBtn.disabled = state;
        chatInput.disabled = state;
    };


    // --- EVENT HANDLERS ---

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (isProcessing) return;

        const prompt = chatInput.value.trim();
        const imageFile = imageUploadInput.files[0];

        if (!prompt && !imageFile) return;

        if (imageFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result.split(',')[1];
                const finalPrompt = prompt || "Tolong jelaskan isi dari gambar ini secara detail dan mendalam.";
                displayMessage(finalPrompt, 'user', reader.result);
                askRakhaAI(finalPrompt, { inline_data: { mime_type: imageFile.type, data: base64Data } });
            };
            reader.readAsDataURL(imageFile);
        } else {
            displayMessage(prompt, 'user');
            askRakhaAI(prompt);
        }
        
        chatInput.value = '';
        imageUploadInput.value = '';
    });

    musicToggleBtn.addEventListener('click', () => {
        if (isMusicPlaying) {
            backgroundMusic.pause();
            musicToggleBtn.style.opacity = '0.5';
        } else {
            backgroundMusic.play();
            musicToggleBtn.style.opacity = '1';
        }
        isMusicPlaying = !isMusicPlaying;
    });


    // --- INISIALISASI ---
    const init = () => {
        displayMessage("Halo, saya Rakha-AI. Silakan ajukan pertanyaan atau unggah gambar.", 'ai');
        
        const suggestions = [
            "Apa itu singularitas AI?",
            "Jelaskan teori relativitas Einstein",
            "Buatkan puisi tentang senja"
        ];

        suggestions.forEach(text => {
            const button = document.createElement('button');
            button.textContent = text;
            button.className = 'bg-gray-800/70 text-sm text-blue-300 border border-blue-500/30 rounded-full px-3 py-1 hover:bg-blue-500/20 transition-colors cursor-pointer';
            button.onclick = () => {
                chatInput.value = text;
                chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
            };
            suggestionsContainer.appendChild(button);
        });
    };

    init();
});
