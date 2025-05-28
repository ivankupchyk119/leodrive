const publicVapidKey = 'BGoHSDg-3OZpY3ygF1TtW3ezvcxotYA82mf9X4Sa8DUqXK6YFy8M0Fqnoq9CJANisUg82XWaKSe5d4QK6lYTphw';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
}

async function subscribeUser(userId) {
  console.log('📡 Попытка подписки пользователя', userId);

  if (!('serviceWorker' in navigator && 'PushManager' in window)) {
    console.warn('❌ Push notifications не поддерживаются');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('❌ Разрешение на уведомления не получено');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/front/public/sw.js'); // Регистрируем в корне, если возможно
    console.log('✅ Service Worker зарегистрирован');

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ userId, subscription })
    });

    if (!res.ok) {
      console.error('❌ Ошибка при отправке подписки на сервер');
      return;
    }

    console.log('✅ Подписка отправлена на сервер');
  } catch (error) {
    console.error('❌ Ошибка подписки:', error);
  }
}
