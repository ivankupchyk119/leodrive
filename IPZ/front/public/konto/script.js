document.addEventListener('DOMContentLoaded', async () => {
    const instructorSelect = document.getElementById('instructorSelect');
    const reviewText = document.getElementById('reviewText');
    const submitReview = document.getElementById('submitReview');
    const reviewList = document.getElementById('reviewList');
    const responseMessage = document.getElementById('responseMessage');
    const reviewError = document.getElementById('reviewError');

    // Fetch instructors
    async function fetchInstructors() {
        try {
            const response = await fetch('http://localhost:5000/api/schedules/instructors', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                populateInstructors(data.instruktors);
            } else {
                throw new Error(data.message || 'Failed to fetch instructors');
            }
        } catch (error) {
            console.error('Błąd podczas pobierania instruktorów:', error.message);
            instructorSelect.innerHTML = '<option value="" disabled>Błąd podczas pobierania instruktorów</option>';
        }
    }

    // Populate instructors in the dropdown
    function populateInstructors(instructors) {
        instructorSelect.innerHTML = '<option value="" disabled selected>Wybierz instruktora</option>';
        instructors.forEach(instructor => {
            const option = document.createElement('option');
            option.value = instructor._id;
            option.textContent = `${instructor.name} ${instructor.surname}`;
            instructorSelect.appendChild(option);
        });
    }

    // Fetch reviews for an instructor
    async function fetchReviews(instructorId) {
        try {
            const response = await fetch(`http://localhost:5000/api/reviews/${instructorId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            console.log(data)
            if (response.ok) {
                displayReviews(data);
            } else {
                throw new Error(data.message || 'Nie udało się pobrać recenzji');
            }
        } catch (error) {
            console.error('Błąd podczas pobierania recenzji:', error.message);
            reviewList.innerHTML = '<p>Błąd podczas pobierania recenzji.</p>';
        }
    }

    // Display reviews in the review list
    function displayReviews(reviews) {
        reviewList.innerHTML = '';
        if (reviews.length === 0) {
            reviewList.innerHTML = '<p>Brak recenzji jeszcze.</p>';
            return;
        }
        reviews.forEach(review => {
            const nameAndSurnmae=review.student.name+' '+review.student.surname
            console.log(4434,review.student.surname)
            const reviewItem = document.createElement('div');
            reviewItem.classList.add('review-item');
            reviewItem.innerHTML = `
                <h3>${nameAndSurnmae}</h3>
                <p>${review.text}</p>
            `;
            reviewList.appendChild(reviewItem);
        });
    }

    // Submit review
    async function submitReviewHandler() {
        const selectedInstructor = instructorSelect.value;
        const review = reviewText.value.trim();

        if (!selectedInstructor) {
            reviewError.textContent = 'Proszę wybrać instruktora';
            reviewError.style.display = 'block';
            return;
        }

        if (!review) {
            reviewError.textContent = 'Recenzja nie może być pusta';
            reviewError.style.display = 'block';
            return;
        }

        reviewError.style.display = 'none';



        try {
            const response = await fetch('http://localhost:5000/api/reviews', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ instructorId: selectedInstructor, text:review }),
            });
            const data = await response.json();

            if (response.ok) {
                responseMessage.textContent = 'Recenzja została pomyślnie wysłana!';
                responseMessage.style.color = 'green';
                reviewText.value = '';
                fetchReviews(selectedInstructor); // Refresh reviews
            } else {
                throw new Error(data.message || 'Nie udało się wysłać recenzji');
            }
        } catch (error) {
            console.error('Błąd podczas wysyłania recenzji:', error.message);
            responseMessage.textContent = 'Błąd podczas wysyłania recenzji. Proszę spróbować ponownie.';
            responseMessage.style.color = 'red';
        }
    }

    // Add event listener to the instructor dropdown
    instructorSelect.addEventListener('change', (event) => {
        const instructorId = event.target.value;
        if (instructorId) {
            fetchReviews(instructorId);
        }
    });

    // Add event listener to the submit button
    submitReview.addEventListener('click', submitReviewHandler);

    // Fetch instructors on page load
    fetchInstructors();
});