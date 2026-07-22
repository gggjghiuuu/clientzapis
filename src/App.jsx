import React, { useState, useEffect } from "react";
import "./App.css";

const GOOGLE_API_URL =
  "https://script.google.com/macros/s/AKfycbweSbL2CdfEAqvTQaTJSTFs38JtBf_DXmsrDMRJpcNsfKHyNRYhTnXGgIdtco-2ZiIC/exec";

const ADDRESSES = ["Конный переулок д.12", "Ул. Покровка д.38 стр.1"];

// Разные временные слоты под задачи
const TEST_DAY_TIME_SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
];

const INTERVIEW_TIME_SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
];

const getNextDates = () => {
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(
      date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        weekday: "short",
      }),
    );
  }
  return dates;
};

const DAYS = getNextDates();

export default function App() {
  const [bookingType, setBookingType] = useState("собеседование");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Определяем активный набор слотов времени в зависимости от типа записи
  const activeTimeSlots =
    bookingType === "тестовый день"
      ? TEST_DAY_TIME_SLOTS
      : INTERVIEW_TIME_SLOTS;

  // Подгрузка занятых слотов
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await fetch(GOOGLE_API_URL);
        const data = await response.json();
        setBookedSlots(data);
      } catch (error) {
        console.error("Ошибка при получении слотов:", error);
      }
    };

    fetchSlots();
  }, [selectedAddress, selectedDay, isConfirmed]);

  // Функция форматирования номера телефона
  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, "");
    if (!phoneNumber) return "";
    let mainNumbers = phoneNumber;
    if (phoneNumber[0] === "7" || phoneNumber[0] === "8") {
      mainNumbers = phoneNumber.substring(1);
    }
    mainNumbers = mainNumbers.substring(0, 10);
    let formatted = "+7";
    if (mainNumbers.length > 0) formatted += ` (${mainNumbers.substring(0, 3)}`;
    if (mainNumbers.length >= 3)
      formatted += `) ${mainNumbers.substring(3, 6)}`;
    if (mainNumbers.length >= 6) formatted += ` ${mainNumbers.substring(6, 8)}`;
    if (mainNumbers.length >= 8)
      formatted += `-${mainNumbers.substring(8, 10)}`;
    return formatted;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !selectedAddress ||
      !selectedDay ||
      !selectedTime ||
      !fullName ||
      !phone
    )
      return;

    setIsLoading(true);

    const typeParam = encodeURIComponent(bookingType);
    const addressParam = encodeURIComponent(selectedAddress.trim());
    const dayParam = encodeURIComponent(selectedDay.trim());
    const timeParam = encodeURIComponent(selectedTime.trim());
    const nameParam = encodeURIComponent(fullName.trim());
    const phoneParam = encodeURIComponent(phone.trim());

    // Теперь передаем также и параметр type
    const finalUrl = `${GOOGLE_API_URL}?action=book&type=${typeParam}&address=${addressParam}&day=${dayParam}&time=${timeParam}&name=${nameParam}&phone=${phoneParam}`;

    try {
      const response = await fetch(finalUrl, {
        method: "GET",
        mode: "cors",
      });

      const result = await response.json();

      if (result.status === "success") {
        setIsConfirmed(true);
      } else if (result.status === "already_booked") {
        alert(
          "Извините, этот слот уже успели занять! Пожалуйста, выберите другое время.",
        );
        setSelectedTime("");
      } else {
        alert("Ошибка сохранения на сервере Google.");
      }
    } catch (error) {
      console.error("Критическая ошибка fetch:", error);

      // Фолбек
      try {
        const verifyResponse = await fetch(GOOGLE_API_URL);
        const verifiedSlots = await verifyResponse.json();

        const isSaved = verifiedSlots.some(
          (slot) =>
            slot.address.toString().trim() ===
              selectedAddress.toString().trim() &&
            slot.day.toString().trim() === selectedDay.toString().trim() &&
            slot.time.toString().trim() === selectedTime.toString().trim(),
        );

        if (isSaved) {
          setIsConfirmed(true);
        } else {
          alert(
            "Таблица заблокировала запрос. Проверь права доступа к веб-приложению (должно быть 'Anyone').",
          );
        }
      } catch (vError) {
        alert("Не удалось связаться с таблицей. Проверь URL веб-приложения.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedAddress("");
    setSelectedDay("");
    setSelectedTime("");
    setFullName("");
    setPhone("");
    setIsConfirmed(false);
  };

  if (isConfirmed) {
    return (
      <div className="booking-container">
        <header className="app-header">
          <div className="brand-badge">Мастерская</div>
          <h1>DABRO IT</h1>
        </header>
        <div className="card confirmation-card">
          <div className="success-icon">✓</div>
          <h2>Запись успешно подтверждена!</h2>
          <p className="confirmation-subtitle">
            Данные внесены в Google Таблицу
          </p>

          <div className="confirmation-details">
            <div className="detail-item">
              <strong>Тип:</strong>{" "}
              {bookingType === "собеседование"
                ? "Собеседование"
                : "Тестовый день"}
            </div>
            <div className="detail-item">
              <strong>ФИО:</strong> {fullName}
            </div>
            <div className="detail-item">
              <strong>Телефон:</strong> {phone}
            </div>
            <div className="detail-item">
              <strong>Адрес:</strong> {selectedAddress}
            </div>
            <div className="detail-item">
              <strong>Дата:</strong> {selectedDay}
            </div>
            <div className="detail-item">
              <strong>Время:</strong> {selectedTime}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleReset}>
            Записать другого кандидата
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <header className="app-header">
        <div className="brand-badge">Мастерская</div>
        <h1>DABRO IT</h1>
      </header>

      <div className="type-selector-card card">
        <button
          className={`type-btn ${bookingType === "собеседование" ? "active" : ""}`}
          type="button"
          onClick={() => {
            setBookingType("собеседование");
            setSelectedTime(""); // Сбрасываем время при смене вкладки
          }}>
          Записаться на собеседование
        </button>
        <button
          className={`type-btn ${bookingType === "тестовый день" ? "active" : ""}`}
          type="button"
          onClick={() => {
            setBookingType("тестовый день");
            setSelectedTime(""); // Сбрасываем время при смене вкладки
          }}>
          Записаться на тестовый день
        </button>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        {/* Шаг 1: Адрес */}
        <div className="card step-card">
          <label className="step-label">1. Выберите адрес проведения</label>
          <div className="grid-list">
            {ADDRESSES.map((address) => (
              <button
                key={address}
                type="button"
                className={`select-item ${selectedAddress === address ? "selected" : ""}`}
                onClick={() => {
                  setSelectedAddress(address);
                  setSelectedDay("");
                  setSelectedTime("");
                }}>
                {address}
              </button>
            ))}
          </div>
        </div>

        {/* Шаг 2: Выбор конкретной даты */}
        <div className={`card step-card ${!selectedAddress ? "disabled" : ""}`}>
          <label className="step-label">2. Выберите дату записи</label>
          <div className="grid-list days-grid">
            {DAYS.map((day) => {
              // Проверяем, есть ли уже хотя бы одна запись на эту дату по выбранному адресу
              const isDayBooked = bookedSlots.some(
                (slot) =>
                  slot.address.toString().trim() ===
                    selectedAddress.toString().trim() &&
                  slot.day.toString().trim() === day.toString().trim(),
              );

              return (
                <button
                  key={day}
                  type="button"
                  disabled={!selectedAddress || isDayBooked}
                  className={`select-item ${selectedDay === day ? "selected" : ""} ${isDayBooked ? "booked" : ""}`}
                  onClick={() => {
                    setSelectedDay(day);
                    setSelectedTime("");
                  }}>
                  {day}
                  {isDayBooked && <span className="booked-badge">занят</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Шаг 3: Время */}
        <div className={`card step-card ${!selectedDay ? "disabled" : ""}`}>
          <div className="step-header">
            <label className="step-label">3. Выберите доступное время</label>
            {selectedDay && (
              <span className="step-hint">
                Статус дня:{" "}
                <strong>
                  {bookedSlots.some(
                    (slot) =>
                      slot.address.toString().trim() ===
                        selectedAddress.toString().trim() &&
                      slot.day.toString().trim() ===
                        selectedDay.toString().trim(),
                  )
                    ? "Занят"
                    : "Свободен"}
                </strong>
              </span>
            )}
          </div>

          <div className="grid-list time-grid">
            {activeTimeSlots.map((time) => {
              // День считается занятым целиком, если есть хоть одна запись на эту дату и адрес
              const isDayBooked = bookedSlots.some(
                (slot) =>
                  slot.address.toString().trim() ===
                    selectedAddress.toString().trim() &&
                  slot.day.toString().trim() === selectedDay.toString().trim(),
              );

              return (
                <button
                  key={time}
                  type="button"
                  disabled={!selectedDay || isDayBooked}
                  className={`select-item time-item ${selectedTime === time ? "selected" : ""} ${isDayBooked ? "booked" : ""}`}
                  onClick={() => setSelectedTime(time)}>
                  {time}
                  {isDayBooked && <span className="booked-badge">занят</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Шаг 4: Личные данные */}
        <div className={`card step-card ${!selectedTime ? "disabled" : ""}`}>
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
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-submit"
            disabled={
              !selectedTime || !fullName || phone.length < 18 || isLoading
            }>
            {isLoading ? "Сохранение..." : "Подтвердить запись"}
          </button>
        </div>
      </form>
    </div>
  );
}
