document.addEventListener('DOMContentLoaded', () => {
    const transcriptElement = document.getElementById('transcript-text');
    const textContainer = document.getElementById('text-container');
    const playButton = document.getElementById('play-btn');
    const pauseButton = document.getElementById('pause-btn');
    const backgroundAudio = document.getElementById('background-audio');
    const wordBank = document.getElementById('word-bank');
    const quizQuestionsContainer = document.getElementById('quiz-questions');
    const checkQuizButton = document.getElementById('check-quiz-btn');
    const quizFeedback = document.getElementById('quiz-feedback');
    const witchPopup = document.getElementById('witch-popup');
    const closeWitchPopup = document.querySelector('#witch-popup .close-btn');

    // --- Audio setup for reading text ---
    // Split text into words and wrap them in a span
    const text = transcriptElement.innerText;
    const words = text.split(/\s+/);
    const htmlWords = words.map(word => `<span class="word">${word}</span>`).join(' ');
    transcriptElement.innerHTML = htmlWords;

    const wordSpans = transcriptElement.querySelectorAll('.word');
    let currentWordIndex = 0;
    let playing = false;
    let timerId = null;

    // Simulate speech-to-text timing. Adjust this value for faster/slower reading.
    const delayPerWord = 180; // in milliseconds (approx. 330 words per minute)

    const highlightWord = () => {
        if (currentWordIndex < wordSpans.length) {
            // Remove highlight from previous word
            if (currentWordIndex > 0) {
                wordSpans[currentWordIndex - 1].classList.remove('highlight');
            }
            
            // Add highlight to current word
            wordSpans[currentWordIndex].classList.add('highlight');

            // Autoscroll logic
            const currentWord = wordSpans[currentWordIndex];
            const containerHeight = textContainer.clientHeight;
            // Calculate word's position relative to the container's scroll top
            const wordOffsetTop = currentWord.offsetTop; 
            
            // If the word is below the visible area, or near the bottom, scroll down
            if (wordOffsetTop > textContainer.scrollTop + containerHeight - 80) { // 80px buffer
                textContainer.scrollTop = wordOffsetTop - containerHeight + 80;
            } else if (wordOffsetTop < textContainer.scrollTop) { // If it's above the visible area (e.g., after manual scroll up)
                textContainer.scrollTop = wordOffsetTop;
            }


            currentWordIndex++;
            timerId = setTimeout(highlightWord, delayPerWord);
        } else {
            // Finished reading
            stopReading();
        }
    };

    const startReading = () => {
        if (!playing) {
            playing = true;
            playButton.style.display = 'none';
            pauseButton.style.display = 'block';
            backgroundAudio.play();
            highlightWord();
        }
    };

    const pauseReading = () => {
        if (playing) {
            playing = false;
            playButton.style.display = 'block';
            pauseButton.style.display = 'none';
            clearTimeout(timerId);
            backgroundAudio.pause();
        }
    };

    const stopReading = () => {
        pauseReading();
        // Remove all highlights
        wordSpans.forEach(word => word.classList.remove('highlight'));
        currentWordIndex = 0;
        textContainer.scrollTop = 0; // Reset scroll position
    }

    playButton.addEventListener('click', startReading);
    pauseButton.addEventListener('click', pauseReading);

    // --- Quiz Logic ---
    const originalPassage = transcriptElement.innerText.trim(); // Get original text before span wrapping
    const sentences = originalPassage.match(/[^.!?]+[.!?]+/g) || []; // Split into sentences
    
    // Select 10 unique words for the quiz to keep it manageable, adjust if needed.
    // Ensure words are not too common, and appear in the passage
    const quizWordsSource = [
        "abandoned", "legend", "roamed", "curiosity", "investigate",
        "skeptical", "howled", "groaned", "glinting", "tarnished",
        "purpose", "pounding", "elegant", "treasure", "ruse",
        "solved", "valuable", "thrilling", "discovery", "rest"
    ];

    let quizData = [];
    const usedWordsInQuiz = new Set(); // To ensure words are unique in the quiz bank

    // Generate 10-15 quiz questions. Prioritize words from quizWordsSource.
    while (quizData.length < 15 && usedWordsInQuiz.size < quizWordsSource.length) {
        const randomIndex = Math.floor(Math.random() * quizWordsSource.length);
        const wordToBlank = quizWordsSource[randomIndex];

        if (!usedWordsInQuiz.has(wordToBlank) && originalPassage.includes(wordToBlank)) {
            // Find a sentence that contains this word
            const sentenceWithWord = sentences.find(s => s.includes(wordToBlank));
            if (sentenceWithWord) {
                const questionText = sentenceWithWord.replace(new RegExp(`\\b${wordToBlank}\\b`, 'i'), '____BLANK____');
                quizData.push({
                    question: questionText.replace('____BLANK____', '<span class="quiz-blank" data-correct-answer="' + wordToBlank + '"></span>'),
                    correctAnswer: wordToBlank
                });
                usedWordsInQuiz.add(wordToBlank);
            }
        }
    }

    // Shuffle quizData to randomize question order
    quizData.sort(() => Math.random() - 0.5);

    // Populate Word Bank and Quiz Questions
    function populateQuiz() {
        wordBank.innerHTML = '';
        quizQuestionsContainer.innerHTML = '';
        quizFeedback.innerHTML = '';
        quizFeedback.classList.remove('correct', 'incorrect');

        const draggableWords = quizData.map(q => q.correctAnswer);
        // Shuffle the draggable words to make it a real quiz
        draggableWords.sort(() => Math.random() - 0.5);

        draggableWords.forEach(word => {
            const span = document.createElement('span');
            span.classList.add('draggable-word');
            span.setAttribute('draggable', true);
            span.textContent = word;
            wordBank.appendChild(span);
        });

        quizData.forEach((item, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('quiz-question');
            questionDiv.innerHTML = `<span>${index + 1}. </span>` + item.question;
            quizQuestionsContainer.appendChild(questionDiv);
        });

        addDragDropListeners();
    }

    let draggedItem = null;

    function addDragDropListeners() {
        const draggables = document.querySelectorAll('.draggable-word');
        const blanks = document.querySelectorAll('.quiz-blank');

        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', (e) => {
                draggedItem = draggable;
                setTimeout(() => draggable.classList.add('dragging'), 0);
            });

            draggable.addEventListener('dragend', () => {
                draggable.classList.remove('dragging');
                draggedItem = null;
            });
        });

        blanks.forEach(blank => {
            blank.addEventListener('dragover', (e) => {
                e.preventDefault(); // Allow drop
                blank.classList.add('drag-over');
            });

            blank.addEventListener('dragleave', () => {
                blank.classList.remove('drag-over');
            });

            blank.addEventListener('drop', (e) => {
                e.preventDefault();
                blank.classList.remove('drag-over');

                if (draggedItem) {
                    // If the blank already has a word, move it back to the word bank
                    const existingWord = blank.querySelector('.draggable-word');
                    if (existingWord) {
                        wordBank.appendChild(existingWord);
                        blank.classList.remove('has-word');
                    }
                    
                    blank.appendChild(draggedItem);
                    blank.classList.add('has-word');
                    // Reset position of the dragged item
                    draggedItem.style.position = 'static'; 
                    draggedItem.style.transform = 'none';
                    draggedItem = null; // Clear dragged item after drop
                }
            });
        });

        // Add drag back to word bank functionality
        wordBank.addEventListener('dragover', (e) => {
            e.preventDefault();
            wordBank.classList.add('drag-over-bank'); // Add a class for visual feedback
        });
        wordBank.addEventListener('dragleave', () => {
            wordBank.classList.remove('drag-over-bank');
        });
        wordBank.addEventListener('drop', (e) => {
            e.preventDefault();
            wordBank.classList.remove('drag-over-bank');
            if (draggedItem && !wordBank.contains(draggedItem)) {
                // Remove from previous blank if any
                const parentBlank = draggedItem.closest('.quiz-blank');
                if (parentBlank) {
                    parentBlank.classList.remove('has-word');
                }
                wordBank.appendChild(draggedItem);
                // Reset position if it was inside a blank
                draggedItem.style.position = 'static';
                draggedItem.style.transform = 'none';
            }
        });
    }

    checkQuizButton.addEventListener('click', () => {
        let allCorrect = true;
        const blanks = document.querySelectorAll('.quiz-blank');
        let correctCount = 0;

        blanks.forEach(blank => {
            const droppedWord = blank.querySelector('.draggable-word');
            const correctAnswer = blank.dataset.correctAnswer;

            // Clear previous feedback styles
            blank.style.borderColor = ''; 
            if (droppedWord) {
                droppedWord.style.backgroundColor = '';
            }

            if (droppedWord && droppedWord.textContent.toLowerCase() === correctAnswer.toLowerCase()) {
                correctCount++;
                blank.style.borderColor = 'var(--correct-color)';
                droppedWord.style.backgroundColor = 'var(--correct-color)';
            } else {
                allCorrect = false;
                blank.style.borderColor = 'var(--incorrect-color)';
                if (droppedWord) {
                    droppedWord.style.backgroundColor = 'var(--incorrect-color)';
                }
            }
        });

        if (allCorrect) {
            quizFeedback.innerHTML = `Congratulations! You got ${correctCount} out of ${blanks.length} correct!`;
            quizFeedback.classList.remove('incorrect');
            quizFeedback.classList.add('correct');
        } else {
            quizFeedback.innerHTML = `Keep trying! You got ${correctCount} out of ${blanks.length} correct.`;
            quizFeedback.classList.remove('correct');
            quizFeedback.classList.add('incorrect');
            showWitchPopup();
        }
    });

    function showWitchPopup() {
        witchPopup.style.display = 'flex';
        // You might want to play a spooky sound here
        // const spookySound = new Audio('spooky_sound.mp3');
        // spookySound.play();
    }

    closeWitchPopup.addEventListener('click', () => {
        witchPopup.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === witchPopup) {
            witchPopup.style.display = 'none';
        }
    });

    // Initialize the quiz when the page loads
    populateQuiz();
});