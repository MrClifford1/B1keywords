document.addEventListener('DOMContentLoaded', () => {
    // --- Game Data (Filtered to 4.1 Cell Biology only) ---
    const b1Keywords = [
        { keyword: "Active transport", definition: "Movement of particles from an area of lower concentration to an area of higher concentration using energy from respiration." }, // 4.1.2.3
        { keyword: "Cell", definition: "The basic structural and functional unit of all known organisms." }, // 4.1.1.1
        { keyword: "Cell membrane", definition: "Controls what enters and leaves the cell." }, // 4.1.1.2
        { keyword: "Cell wall", definition: "A rigid outer layer in plant and algal cells, providing support and protection." }, // 4.1.1.2
        { keyword: "Chloroplast", definition: "Organelle in plant and algal cells where photosynthesis takes place." }, // 4.1.1.2, 4.1.2.4
        { keyword: "Chromosome", definition: "Thread-like structure made of DNA, found in the nucleus, carrying genetic information." }, // 4.1.1.5
        { keyword: "Concentration gradient", definition: "The difference in concentration between two areas." }, // 4.1.2.2
        { keyword: "Cytoplasm", definition: "Jelly-like substance filling the cell, where most chemical reactions occur." }, // 4.1.1.2
        { keyword: "Differentiated cell", definition: "A cell that has specialised to perform a specific function." }, // 4.1.2.1
        { keyword: "Diffusion", definition: "Net movement of particles from an area of higher concentration to an area of lower concentration." }, // 4.1.2.2
        { keyword: "DNA", definition: "Deoxyribonucleic acid, the genetic material found in all living organisms." }, // 4.1.1.5
        { keyword: "Eukaryotic cell", definition: "A cell that has a nucleus and other membrane-bound organelles." }, // 4.1.1.2
        { keyword: "Magnification", definition: "How many times larger an image appears compared to the actual size of the object." }, // 4.1.1.1
        { keyword: "Meristem", definition: "Regions of undifferentiated cells in plants where growth occurs." }, // 4.1.2.1
        { keyword: "Mitochondria", definition: "Organelles where aerobic respiration takes place, releasing energy." }, // 4.1.1.2
        { keyword: "Mitosis", definition: "A type of cell division that produces two genetically identical diploid daughter cells." }, // 4.1.2.1
        { keyword: "Nucleus", definition: "Contains the cell's genetic material and controls cell activities." }, // 4.1.1.2
        { keyword: "Osmosis", definition: "The net movement of water molecules across a partially permeable membrane from an area of higher water potential to an area of lower water potential." }, // 4.1.2.3
        { keyword: "Photosynthesis", definition: "The process by which plants and other organisms use sunlight to synthesize foods from carbon dioxide and water." }, // 4.1.2.4
        { keyword: "Prokaryotic cell", definition: "A cell that lacks a nucleus and other membrane-bound organelles (e.g., bacteria)." }, // 4.1.1.2
        { keyword: "Ribosome", definition: "Organelles responsible for protein synthesis." }, // 4.1.1.2
        { keyword: "Stem cell", definition: "An undifferentiated cell that can differentiate into various specialised cell types." }, // 4.1.2.1
        { keyword: "Vacuole", definition: "A membrane-bound sac within the cytoplasm of a cell, involved in storage and maintaining turgor pressure in plant cells." } // 4.1.1.2
    ];

    // --- DOM Elements ---
    const startGameBtn = document.getElementById('start-game-btn');
    const gameBoard = document.getElementById('game-board');
    const instructions = document.querySelector('.instructions');
    const definitionsContainer = document.getElementById('definitions-container');
    const keywordsContainer = document.getElementById('keywords-container');
    const checkAnswersBtn = document.getElementById('check-answers-btn');
    const timerDisplay = document.getElementById('timer');
    const scoresList = document.getElementById('high-scores-list');
    const feedbackArea = document.getElementById('feedback-area');
    const gameMessage = document.getElementById('game-message');
    const playAgainBtn = document.getElementById('play-again-btn');

    // New pause elements
    const pauseOverlay = document.getElementById('pause-overlay');
    const continueGameBtn = document.getElementById('continue-game-btn');
    const gameArea = document.getElementById('game-area'); // Get the game-area div
    const pauseGameBtn = document.createElement('button'); // Create the pause button
    pauseGameBtn.id = 'pause-game-btn';
    pauseGameBtn.textContent = 'Pause';
    // Append the pause button to the top-level container to place it relative to the game area.
    // Ensure .container has position: relative in CSS for this to work well.
    document.querySelector('.container').appendChild(pauseGameBtn);


    // --- Game State Variables ---
    let currentKeywords = []; // The 5 keywords for the current game
    let usedKeywords = JSON.parse(localStorage.getItem('b1_used_keywords')) || {}; // Track keyword usage for broader coverage
    let timerInterval;
    let startTime;
    let pausedTime = 0; // Stores the time when the game was paused (in milliseconds)
    let isPaused = false; // Flag to track pause state
    let droppedKeywords = new Map(); // Map to store dropped keyword element and its original definition element
    let draggedItem = null; // To keep track of the keyword being dragged

    // --- Local Storage Keys ---
    const LOCAL_STORAGE_SCORES_KEY = 'b1_keyword_game_scores';
    const LOCAL_STORAGE_USED_KEYWORDS_KEY = 'b1_used_keywords';

    // --- Functions ---

    /**
     * Initializes the game by setting up event listeners and loading scores.
     */
    function initGame() {
        startGameBtn.addEventListener('click', startGame);
        checkAnswersBtn.addEventListener('click', checkAnswers);
        playAgainBtn.addEventListener('click', startGame);
        pauseGameBtn.addEventListener('click', pauseGame); // New event listener for pause
        continueGameBtn.addEventListener('click', continueGame); // New event listener for continue
        loadScores();
    }

    /**
     * Selects 5 random keywords for the game, prioritizing those not used recently.
     * Updates the `usedKeywords` tracking object.
     * @returns {Array} An array of 5 keyword objects.
     */
    function selectKeywords() {
        // Sort keywords by last used timestamp (oldest first)
        const sortedKeywords = [...b1Keywords].sort((a, b) => {
            const aLastUsed = usedKeywords[a.keyword] || 0;
            const bLastUsed = usedKeywords[b.keyword] || 0;
            return aLastUsed - bLastUsed;
        });

        // Select the first 5 (least recently used)
        let selected = sortedKeywords.slice(0, 5);

        // If there aren't 5 unique keywords or if we've used all, shuffle and pick from all
        if (selected.length < 5) {
            const shuffledAll = [...b1Keywords].sort(() => Math.random() - 0.5);
            selected = shuffledAll.slice(0, 5);
        }

        // Update usage timestamps for the selected keywords
        const now = Date.now();
        selected.forEach(item => {
            usedKeywords[item.keyword] = now;
        });
        localStorage.setItem(LOCAL_STORAGE_USED_KEYWORDS_KEY, JSON.stringify(usedKeywords));

        return selected;
    }

    /**
     * Shuffles an array randomly.
     * @param {Array} array The array to shuffle.
     * @returns {Array} The shuffled array.
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Starts a new game round.
     */
    function startGame() {
        resetGame(); // Ensure game board and feedback are hidden and instructions are shown initially
        currentKeywords = selectKeywords(); // Select 5 keywords

        // Display definitions
        definitionsContainer.innerHTML = '';
        currentKeywords.forEach((item, index) => {
            const definitionDiv = document.createElement('div');
            definitionDiv.classList.add('definition-item');
            definitionDiv.dataset.keyword = item.keyword; // Store correct keyword for checking
            definitionDiv.innerHTML = `
                <div class="definition-text">${index + 1}. ${item.definition}</div>
                <div class="keyword-drop-area" data-definition-index="${index}"></div>
            `;
            definitionsContainer.appendChild(definitionDiv);
        });

        // Display shuffled keywords
        keywordsContainer.innerHTML = '';
        const shuffledKeywords = shuffleArray(currentKeywords.map(item => item.keyword));
        shuffledKeywords.forEach(keyword => {
            const keywordDiv = document.createElement('div');
            keywordDiv.classList.add('keyword-item');
            keywordDiv.textContent = keyword;
            keywordDiv.setAttribute('draggable', true);
            keywordDiv.dataset.keyword = keyword; // Store keyword value
            keywordsContainer.appendChild(keywordDiv);
        });

        setupDragAndDrop();
        startTimer();

        // Show game board, hide instructions and feedback
        instructions.style.display = 'none';
        feedbackArea.style.display = 'none';
        gameBoard.style.display = 'flex'; // Make game board visible
        checkAnswersBtn.style.display = 'block'; // Show check answers button
        pauseGameBtn.style.display = 'block'; // Show pause button
    }

    /**
     * Resets the game state and UI elements.
     */
    function resetGame() {
        clearInterval(timerInterval);
        timerDisplay.textContent = '00:00';
        startTime = 0; // Reset start time
        pausedTime = 0; // Reset paused time
        isPaused = false; // Ensure not paused
        definitionsContainer.innerHTML = '';
        keywordsContainer.innerHTML = '';
        gameMessage.textContent = '';
        droppedKeywords.clear(); // Clear the map
        draggedItem = null;

        // Ensure all keywords are visible if a game was aborted/restarted
        document.querySelectorAll('.keyword-item.dropped').forEach(el => {
            el.classList.remove('dropped');
            el.style.display = 'block';
        });

        // Hide game board and feedback area at reset
        gameBoard.style.display = 'none';
        feedbackArea.style.display = 'none';
        instructions.style.display = 'block'; // Show instructions again
        checkAnswersBtn.style.display = 'none';
        pauseGameBtn.style.display = 'none'; // Hide pause button
        pauseOverlay.classList.remove('visible'); // Hide pause overlay
    }

    /**
     * Sets up drag and drop functionality for keywords and drop areas.
     */
    function setupDragAndDrop() {
        const keywordItems = document.querySelectorAll('.keyword-item');
        const dropAreas = document.querySelectorAll('.keyword-drop-area');

        // Drag start
        keywordItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                if (isPaused) { // Prevent dragging if paused
                    e.preventDefault();
                    return;
                }
                draggedItem = item;
                setTimeout(() => item.classList.add('dragging'), 0); // Add class after a slight delay for visual
            });
        });

        // Drag end (clean up)
        document.addEventListener('dragend', () => {
            if (draggedItem) {
                draggedItem.classList.remove('dragging');
                draggedItem = null;
            }
        });

        // Drop area events
        dropAreas.forEach(dropArea => {
            dropArea.addEventListener('dragover', (e) => {
                if (isPaused) { // Prevent dragging if paused
                    e.preventDefault();
                    return;
                }
                e.preventDefault(); // Allow drop
                dropArea.classList.add('hover');
            });

            dropArea.addEventListener('dragleave', () => {
                dropArea.classList.remove('hover');
            });

            dropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                dropArea.classList.remove('hover');

                if (!draggedItem || isPaused) return; // No item being dragged or game is paused

                // If a keyword is already in this drop area, move it back to the keywords container
                if (dropArea.children.length > 0) {
                    const existingKeyword = dropArea.children[0];
                    existingKeyword.classList.remove('dropped'); // Ensure it's not hidden
                    existingKeyword.style.display = 'block'; // Make it visible again
                    keywordsContainer.appendChild(existingKeyword); // Move it back to the general pool
                }

                // Append the dragged item
                dropArea.appendChild(draggedItem);
                draggedItem.classList.add('dropped'); // Mark as dropped
                draggedItem.style.display = 'block'; // Ensure it's visible in the drop area itself

                // Record the drop: map keyword (from its dataset) to the drop area element
                droppedKeywords.set(draggedItem.dataset.keyword, dropArea);
            });
        });

        // Allow moving a dropped keyword back to the keywords container directly from a drop area
        keywordsContainer.addEventListener('dragover', (e) => {
            if (isPaused) { // Prevent dragging if paused
                e.preventDefault();
                return;
            }
            e.preventDefault();
            keywordsContainer.classList.add('hover');
        });

        keywordsContainer.addEventListener('dragleave', () => {
            keywordsContainer.classList.remove('hover');
        });

        keywordsContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            keywordsContainer.classList.remove('hover');

            if (!draggedItem || isPaused) return; // No item being dragged or game is paused

            if (draggedItem.parentElement && draggedItem.parentElement.classList.contains('keyword-drop-area')) {
                // It's a keyword coming from a drop area, put it back in the main keywords pool
                draggedItem.classList.remove('dropped'); // Remove dropped class to make it look normal in the pool
                draggedItem.style.display = 'block'; // Ensure visibility
                keywordsContainer.appendChild(draggedItem);

                // Remove from the droppedKeywords map
                for (let [key, value] of droppedKeywords.entries()) {
                    if (value === draggedItem.parentElement) {
                        droppedKeywords.delete(key);
                        break;
                    }
                }
            }
        });
    }

    /**
     * Updates the timer display.
     */
    function updateTimer() {
        const elapsedTime = Date.now() - startTime;
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        timerDisplay.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Starts the game timer.
     */
    function startTimer() {
        // Resume from paused time if applicable, otherwise start fresh
        startTime = Date.now() - pausedTime;
        timerInterval = setInterval(updateTimer, 1000);
        isPaused = false;
    }

    /**
     * Stops the game timer.
     * @returns {number} The elapsed time in milliseconds.
     */
    function stopTimer() {
        clearInterval(timerInterval);
        const finalTime = Date.now() - startTime;
        pausedTime = 0; // Reset for next game
        isPaused = false;
        return finalTime;
    }

    /**
     * Pauses the game timer and shows the pause overlay.
     */
    function pauseGame() {
        if (!isPaused) { // Only pause if not already paused
            clearInterval(timerInterval);
            pausedTime = Date.now() - startTime; // Store elapsed time
            isPaused = true;
            pauseOverlay.classList.add('visible'); // Show the overlay
        }
    }

    /**
     * Continues the game from the pause state.
     */
    function continueGame() {
        if (isPaused) { // Only continue if paused
            pauseOverlay.classList.remove('visible'); // Hide the overlay
            startTimer(); // Resume the timer from where it left off
        }
    }

    /**
     * Checks the user's answers and displays feedback.
     */
    function checkAnswers() {
        const elapsedTime = stopTimer(); // Stop timer when checking answers
        let correctMatches = 0;
        const totalDefinitions = currentKeywords.length;

        const definitionItems = document.querySelectorAll('.definition-item');
        definitionItems.forEach(defItem => {
            const dropArea = defItem.querySelector('.keyword-drop-area');
            const droppedKeywordElement = dropArea.querySelector('.keyword-item');

            // Reset any previous styling
            defItem.classList.remove('correct', 'incorrect');
            if (droppedKeywordElement) {
                droppedKeywordElement.classList.remove('correct-match', 'incorrect-match');
            }

            if (droppedKeywordElement) {
                const droppedKeyword = droppedKeywordElement.dataset.keyword;
                const correctKeyword = defItem.dataset.keyword;

                if (droppedKeyword === correctKeyword) {
                    correctMatches++;
                    defItem.classList.add('correct');
                    droppedKeywordElement.classList.add('correct-match');
                } else {
                    defItem.classList.add('incorrect');
                    droppedKeywordElement.classList.add('incorrect-match');
                }
            } else {
                defItem.classList.add('incorrect');
            }
        });

        // Display results
        let message = '';
        if (correctMatches === totalDefinitions) {
            message = `🎉 Excellent! You got all ${totalDefinitions} correct in ${timerDisplay.textContent}!`;
            saveScore(elapsedTime);
        } else {
            message = `You got ${correctMatches} out of ${totalDefinitions} correct. Keep practicing!`;
        }
        gameMessage.textContent = message;
        feedbackArea.style.display = 'block';
        checkAnswersBtn.style.display = 'none';
        gameBoard.style.display = 'none';
        pauseGameBtn.style.display = 'none'; // Hide pause button after game ends

        loadScores();
    }

    /**
     * Saves the player's score to local storage.
     * @param {number} timeInMs The time taken for the game in milliseconds.
     */
    function saveScore(timeInMs) {
        let scores = getScores();
        scores.push({
            time: timeInMs,
            date: new Date().toISOString()
        });
        scores.sort((a, b) => a.time - b.time);
        localStorage.setItem(LOCAL_STORAGE_SCORES_KEY, JSON.stringify(scores));
    }

    /**
     * Retrieves scores from local storage.
     * @returns {Array} An array of score objects.
     */
    function getScores() {
        const scoresString = localStorage.getItem(LOCAL_STORAGE_SCORES_KEY);
        return scoresString ? JSON.parse(scoresString) : [];
    }

    /**
     * Loads and displays scores from local storage.
     */
    function loadScores() {
        const scores = getScores();
        scoresList.innerHTML = '';
        if (scores.length === 0) {
            scoresList.innerHTML = '<li>No scores yet. Play a game to see your best times!</li>';
            return;
        }

        scores.sort((a, b) => a.time - b.time);

        scores.forEach((score, index) => {
            const listItem = document.createElement('li');
            const minutes = Math.floor(score.time / 60000);
            const seconds = Math.floor((score.time % 60000) / 1000);
            const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            const date = new Date(score.date).toLocaleString();
            listItem.innerHTML = `<span>#${index + 1}</span> <span>${timeFormatted}</span> <small>(${date})</small>`;
            scoresList.appendChild(listItem);
        });
    }

    // --- Initialize the Game ---
    initGame();
});
