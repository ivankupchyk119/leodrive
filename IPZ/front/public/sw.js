self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Напоминание';
  const options = {
    body: data.body || 'У тебя новое уведомление',
    icon: '/front/images/logofull.png',
    data: {
      lessonId: data.lessonId,
      instructor: data.instructor,
      student: data.student,
      date: data.date,
      type: data.type,
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

