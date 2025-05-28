document.addEventListener('DOMContentLoaded', async function () {

    // Check if the user is authenticated
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Nie jesteś zalogowany. Proszę się zalogować, aby zapisać wynik.");
        window.location.href = 'login.html'; // Redirect to login page
        return; // Stop execution if not authenticated
    }

    // Verify token by sending a request to the backend
    try {
        const authResponse = await fetch('http://localhost:5000/api/auth/checkAuth', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Send the token in the header
            },
        });

        if (!authResponse.ok) {
            throw new Error('Token is invalid. Please log in again.');
        }
    } catch (error) {
        alert(error.message);
        window.location.href = 'login.html'; // Redirect to login page
        return; // Stop execution if token is invalid
    }

    const questions = document.querySelectorAll('.question');
    const submitBtn = document.querySelector('.submit-btn');
    let correctAnswers = 0;

    // Add click event listener for options
    questions.forEach(question => {
        const options = question.querySelectorAll('.option');
        const explanation = question.querySelector('.explanation'); // Get explanation block

        options.forEach(option => {
            option.addEventListener('click', function () {
                // Disable further clicks in this question
                options.forEach(opt => opt.style.pointerEvents = 'none');

                // Check if the selected option is correct or not
                const isCorrect = this.getAttribute('data-correct') === 'true';

                // Apply the correct or incorrect class immediately
                if (isCorrect) {
                    this.classList.add('correct');
                    correctAnswers++; // Increment the count of correct answers
                } else {
                    this.classList.add('incorrect');
                }

                // Highlight the correct answer in green if it wasn't selected
                options.forEach(opt => {
                    if (opt !== this && opt.getAttribute('data-correct') === 'true') {
                        opt.classList.add('correct');
                    }
                });

                // Show explanation after selecting an option
                explanation.style.display = 'block';
            });
        });
    });

    submitBtn.addEventListener('click', async function () {
        const totalQuestions = questions.length;
        const resultPercentage = Math.round((correctAnswers / totalQuestions) * 100);

        const testName = window.location.pathname.split('/').pop().replace('.html', '');
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('cat') || 'B';

        try {
            const response = await fetch('http://localhost:5000/api/testResults/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category,
                    testName,
                    result: resultPercentage,
                }),
            });

            if (response.ok) {
                alert(`Twój wynik: ${resultPercentage}%. Zapisano wynik testu!`);
                window.location.href = 'theory.html';
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Błąd podczas zapisu wyniku');
            }
        } catch (error) {
            console.error('Błąd:', error.message);
            alert(`Błąd: ${error.message}`);
        }
    });


    // Day/Night Mode Functionality
    const themeToggle = document.createElement('button');
    themeToggle.id = 'themeToggle';
    themeToggle.textContent = '☀️';
    themeToggle.style.position = 'fixed';
    themeToggle.style.top = '20px';
    themeToggle.style.right = '20px';
    themeToggle.style.background = 'none';
    themeToggle.style.border = 'none';
    themeToggle.style.fontSize = '24px';
    themeToggle.style.cursor = 'pointer';
    themeToggle.style.transition = 'transform 0.3s';
    document.body.appendChild(themeToggle);

    const body = document.body;

    // Set initial theme based on localStorage
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    body.className = savedTheme;
    themeToggle.textContent = savedTheme === 'dark-theme' ? '🌙' : '☀️';

    // Add event listener for theme toggle
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        body.classList.toggle('light-theme');

        // Update button text
        themeToggle.textContent = body.classList.contains('dark-theme') ? '🌙' : '☀️';

        // Save current theme to localStorage
        const currentTheme = body.classList.contains('dark-theme') ? 'dark-theme' : 'light-theme';
        localStorage.setItem('theme', currentTheme);
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const questions = document.querySelectorAll('.question');
  questions.forEach((q, i) => {
    q.style.animationDelay = `${i * 0.1}s`;
  });
});