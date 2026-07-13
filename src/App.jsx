import React, { useState, useEffect } from 'react';
import './App.css';

// ВСТАВЬ СЮДА СВОЙ URL, КОТОРЫЙ СКОПИРОВАЛ ИЗ GOOGLE APPS SCRIPT
const GOOGLE_API_URL = 'https://script.google.com/macros/s/AKfycbweSbL2CdfEAqvTQaTJSTFs38JtBf_DXmsrDMRJpcNsfKHyNRYhTnXGgIdtco-2ZiIC/exec';

const ADDRESSES = [
  'Москва, ул. Ленина, д. 10',
  'Санкт-Петербург, Невский пр., д. 25',
  'Новосибирск, пр. Димитрова, д. 4'
];

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

const TIME_SLOTS = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

export default function App() {
  const [bookingType, setBookingType] = useState('собеседование');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  // Хранилище занятых слотов, полученных из Google Таблицы
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Загрузка занятых слотов при старте приложения
  const fetchBookedSlots = async () => {
    try {
      const response = await fetch(GOOGLE_API_URL);
      const data = await response.json();
      setBookedSlots(data);
    } catch (error) {
      console.error("Ошибка при получении слотов:", error);
    }
  };

  useEffect(() => {
    fetchBookedSlots();
  }, []);

  // Проверка занятости слота на основе данных из Google Таблицы
  const isSlotBooked = (address, day, time) => {
    return bookedSlots.some(slot => 
      slot.address === address && 
      slot.day === day && 
      slot.time === time
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAddress || !selectedDay || !selectedTime || !fullName || !phone) return;

    setIsLoading(true);

    const bookingData = {
      bookingType,
      selectedAddress,
      selectedDay,
      selectedTime,
      fullName,
      phone
    };

    try {
      // Отправляем данные в Google Таблицу
      const response = await fetch(GOOGLE_API_URL, {
        method: 'POST',
        mode: 'no-cors', // Важно для Apps Script, чтобы обойти ограничения CORS
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      // Так как используется режим no-cors, мы не сможем прочитать ответ, 
      // но если исключения не произошло — запись успешно улетела
      setIsConfirmed(true);
      // Обновляем список слотов локально
      setBookedSlots([...bookedSlots, { address: selectedAddress, day: selectedDay, time: selectedTime }]);
    } catch (error) {
      alert("Не удалось сохранить запись. Попробуйте снова.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  const formatPhoneNumber = (value) => {
  // Очищаем строку от всех нецифровых символов
  const phoneNumber = value.replace(/\D/g, '');
  
  // Если строка пустая, возвращаем пустой результат
  if (!phoneNumber) return '';

  // Если ввод начинается с 7 или 8, отсекаем эту первую цифру для единого формата
  let mainNumbers = phoneNumber;
  if (phoneNumber[0] === '7' || phoneNumber[0] === '8') {
    mainNumbers = phoneNumber.substring(1);
  }

  // Ограничиваем длину 10 цифрами (без учета +7)
  mainNumbers = mainNumbers.substring(0, 10);

  // Форматируем по маске: +7 (985) 148 40-74
  let formatted = '+7';
  
  if (mainNumbers.length > 0) {
    formatted += ` (${mainNumbers.substring(0, 3)}`;
  }
  if (mainNumbers.length >= 3) {
    formatted += `) ${mainNumbers.substring(3, 6)}`;
  }
  if (mainNumbers.length >= 6) {
    formatted += ` ${mainNumbers.substring(6, 8)}`;
  }
  if (mainNumbers.length >= 8) {
    formatted += `-${mainNumbers.substring(8, 10)}`;
  }
  
  return formatted;
};
  const handleReset = () => {
    setSelectedAddress('');
    setSelectedDay('');
    setSelectedTime('');
    setFullName('');
    setPhone('');
    setIsConfirmed(false);
    fetchBookedSlots(); // Перезапрашиваем свежие данные
  };

  if (isConfirmed) {
    return (
      <div className="booking-container">
        <div className="card confirmation-card">
          <div className="success-icon">✓</div>
          <h2>Запись успешно подтверждена!</h2>
          <p className="confirmation-subtitle">Данные синхронизированы с Google Таблицей</p>
          
          <div className="confirmation-details">
            <div className="detail-item"><strong>Тип:</strong> {bookingType}</div>
            <div className="detail-item"><strong>ФИО:</strong> {fullName}</div>
            <div className="detail-item"><strong>Телефон:</strong> {phone}</div>
            <div className="detail-item"><strong>Адрес:</strong> {selectedAddress}</div>
            <div className="detail-item"><strong>День недели:</strong> {selectedDay}</div>
            <div className="detail-item"><strong>Время:</strong> {selectedTime}</div>
          </div>

          <button className="btn btn-primary" onClick={handleReset}>Записать другого кандидата</button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <div className="type-selector-card card">
        <button 
          className={`type-btn ${bookingType === 'собеседование' ? 'active' : ''}`}
          onClick={() => setBookingType('собеседование')}
        >
          Записаться на собеседование
        </button>
        <button 
          className={`type-btn ${bookingType === 'тестовый день' ? 'active' : ''}`}
          onClick={() => setBookingType('тестовый день')}
        >
          Записаться на тестовый день
        </button>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        
        {/* ШАГ 1: Адрес */}
        <div className="card step-card">
          <label className="step-label">1. Выберите адрес проведения</label>
          <div className="grid-list">
            {ADDRESSES.map((address) => (
              <button
                key={address}
                type="button"
                className={`select-item ${selectedAddress === address ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedAddress(address);
                  setSelectedDay('');
                  setSelectedTime('');
                }}
              >
                {address}
              </button>
            ))}
          </div>
        </div>

        {/* ШАГ 2: День недели */}
        <div className={`card step-card ${!selectedAddress ? 'disabled' : ''}`}>
          <label className="step-label">2. Выберите день недели</label>
          <div className="grid-list days-grid">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                disabled={!selectedAddress}
                className={`select-item ${selectedDay === day ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedDay(day);
                  setSelectedTime('');
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* ШАГ 3: Время */}
        <div className={`card step-card ${!selectedDay ? 'disabled' : ''}`}>
          <label className="step-label">3. Выберите доступное время</label>
          <div className="grid-list time-grid">
            {TIME_SLOTS.map((time) => {
              const booked = isSlotBooked(selectedAddress, selectedDay, time);
              return (
                <button
                  key={time}
                  type="button"
                  disabled={!selectedDay || booked}
                  className={`select-item time-item ${selectedTime === time ? 'selected' : ''} ${booked ? 'booked' : ''}`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time} {booked && <span className="booked-badge">занят</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ШАГ 4: Личные данные */}
        <div className={`card step-card ${!selectedTime ? 'disabled' : ''}`}>
          <label className="step-label">4. Личные данные кандидата</label>
          <div className="input-group">
            <div className="input-field">
              <input
                type="text"
                placeholder="ФИО полностью"
                required
                disabled={!selectedTime || isLoading}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="input-field">
  <input
    type="tel"
    placeholder="+7 (999) 000 00-00"
    required
    disabled={!selectedTime || isLoading}
    value={phone}
    onChange={(e) => {
      const formattedValue = formatPhoneNumber(e.target.value);
      setPhone(formattedValue);
    }}
  />
</div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-submit"
            disabled={!selectedTime || !fullName || !phone || isLoading}
          >
            {isLoading ? 'Сохранение...' : 'Подтвердить запись'}
          </button>
        </div>

      </form>
    </div>
  );
}