// Инициализация Telegram Mini App
let tg = window.Telegram.WebApp;
tg.expand();

// Применение Telegram тем
function applyTelegramStyles() {
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
    document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
    document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#5288c1');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f0f0f0');
}

// Применяем стили при загрузке
applyTelegramStyles();

// Глобальные переменные
const API_URL = 'https://your-backend-api.com'; // Замените на URL вашего API
let currentUser = null;
let uploadedImages = [];

// DOM-элементы
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addSellingBtn = document.getElementById('add-selling-btn');
const addLookingBtn = document.getElementById('add-looking-btn');
const createListingModal = document.getElementById('create-listing-modal');
const viewListingModal = document.getElementById('view-listing-modal');
const listingForm = document.getElementById('listing-form');
const listingTypeInput = document.getElementById('listing-type');
const descriptionInput = document.getElementById('listing-description');
const charCount = document.getElementById('char-count');
const closeButtons = document.querySelectorAll('.close');
const cancelButtons = document.querySelectorAll('.cancel-btn');
const deleteListingBtn = document.getElementById('delete-listing-btn');
const contactSellerBtn = document.getElementById('contact-seller-btn');

// Переключение между вкладками
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        
        // Удаляем активный класс со всех кнопок и контентов
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Добавляем активный класс нужной кнопке и контенту
        button.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        // Загружаем данные для выбранной вкладки
        loadTabData(tabName);
    });
});

// Загрузка данных для вкладки
function loadTabData(tabName) {
    switch(tabName) {
        case 'selling':
            loadListings('selling');
            break;
        case 'looking':
            loadListings('looking');
            break;
        case 'guarantors':
            loadGuarantors();
            break;
    }
}

// Загрузка объявлений
async function loadListings(type) {
    const container = document.getElementById(`${type}-listings`);
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        // В реальном приложении здесь будет запрос к API
        // Для примера используем моковые данные
        const mockListings = await getMockListings(type);
        
        if (mockListings.length === 0) {
            container.innerHTML = `<p class="no-data">Нет ${type === 'selling' ? 'объявлений о продаже' : 'запросов на покупку'}</p>`;
            return;
        }
        
        container.innerHTML = '';
        mockListings.forEach(listing => {
            const card = createListingCard(listing);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading listings:', error);
        container.innerHTML = '<p class="error">Ошибка загрузки данных. Пожалуйста, попробуйте позже.</p>';
    }
}

// Создание карточки объявления
function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.innerHTML = `
        <div class="listing-title">${listing.title}</div>
        <div class="listing-preview">${listing.description}</div>
        <div class="listing-meta">
            <span class="listing-author">${listing.author}</span>
            <span class="listing-date">${formatDate(listing.created_at)}</span>
        </div>
    `;
    
    card.addEventListener('click', () => {
        openListingDetails(listing);
    });
    
    return card;
}

// Открытие деталей объявления
function openListingDetails(listing) {
    const titleEl = document.getElementById('view-listing-title');
    const imagesContainer = document.getElementById('view-listing-images');
    const descriptionEl = document.getElementById('view-listing-description');
    const authorEl = document.getElementById('view-listing-author');
    const dateEl = document.getElementById('view-listing-date');
    
    titleEl.textContent = listing.title;
    descriptionEl.textContent = listing.description;
    authorEl.textContent = listing.author;
    dateEl.textContent = formatDate(listing.created_at);
    
    // Очищаем контейнер с изображениями
    imagesContainer.innerHTML = '';
    
    // Добавляем изображения, если они есть
    if (listing.images && listing.images.length > 0) {
        listing.images.forEach(imageUrl => {
            const img = document.createElement('img');
            img.className = 'listing-image';
            img.src = imageUrl;
            img.alt = 'Изображение объявления';
            imagesContainer.appendChild(img);
        });
    } else {
        imagesContainer.style.display = 'none';
    }
    
    // Проверяем, может ли пользователь удалить объявление
    // (владелец объявления, администратор или модератор)
    if (currentUser && (currentUser.id === listing.user_id || currentUser.is_admin || currentUser.is_moderator)) {
        deleteListingBtn.style.display = 'block';
        deleteListingBtn.onclick = () => deleteListing(listing.id);
    } else {
        deleteListingBtn.style.display = 'none';
    }
    
    // Настраиваем кнопку "Связаться с продавцом"
    contactSellerBtn.onclick = () => contactSeller(listing.user_id, listing.title);
    
    // Открываем модальное окно
    viewListingModal.style.display = 'block';
}

// Загрузка гарантов
async function loadGuarantors() {
    const container = document.getElementById('guarantors-list');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        // В реальном приложении здесь будет запрос к API
        // Для примера используем моковые данные
        const mockGuarantors = await getMockGuarantors();
        
        if (mockGuarantors.length === 0) {
            container.innerHTML = '<p class="no-data">Список гарантов пуст</p>';
            return;
        }
        
        container.innerHTML = '';
        mockGuarantors.forEach(guarantor => {
            const card = document.createElement('div');
            card.className = 'guarantor-card';
            card.innerHTML = `
                <div class="guarantor-name">${guarantor.name}</div>
                <div class="guarantor-contact">${guarantor.contact}</div>
                <div class="guarantor-description">${guarantor.description}</div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading guarantors:', error);
        container.innerHTML = '<p class="error">Ошибка загрузки данных. Пожалуйста, попробуйте позже.</p>';
    }
}

// Открытие модального окна создания объявления
function openCreateListingModal(type) {
    // Сбрасываем форму
    listingForm.reset();
    uploadedImages = [];
    updateImagePreviews();
    
    // Устанавливаем тип объявления
    listingTypeInput.value = type;
    
    // Устанавливаем заголовок модального окна
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = type === 'selling' ? 'Добавить объявление о продаже' : 'Добавить запрос на покупку';
    
    // Открываем модальное окно
    createListingModal.style.display = 'block';
}

// Закрытие модальных окон
function closeModals() {
    createListingModal.style.display = 'none';
    viewListingModal.style.display = 'none';
}

// Отправка объявления
async function submitListing(event) {
    event.preventDefault();
    
    const title = document.getElementById('listing-title').value;
    const description = document.getElementById('listing-description').value;
    const type = document.getElementById('listing-type').value;
    
    if (!title || !description) {
        alert('Пожалуйста, заполните все обязательные поля.');
        return;
    }
    
    if (description.length > 1000) {
        alert('Описание не должно превышать 1000 символов.');
        return;
    }
    
    // Создаем объект с данными
    const listingData = {
        action: 'add_listing',
        type: type,
        title: title,
        description: description,
        images: uploadedImages
    };
    
    try {
        // В реальном приложении здесь будет отправка данных на сервер
        // Для примера просто закрываем модальное окно и перезагружаем данные
        console.log('Отправка объявления:', listingData);
        
        // Отправляем данные в Telegram
        tg.sendData(JSON.stringify(listingData));
        
        // Закрываем модальное окно
        closeModals();
        
        // Перезагружаем данные на текущей вкладке
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        loadTabData(activeTab);
    } catch (error) {
        console.error('Error submitting listing:', error);
        alert('Произошла ошибка при отправке объявления. Пожалуйста, попробуйте позже.');
    }
}

// Удаление объявления
async function deleteListing(listingId) {
    if (!confirm('Вы уверены, что хотите удалить это объявление?')) {
        return;
    }
    
    // Создаем объект с данными
    const deleteData = {
        action: 'delete_listing',
        listing_id: listingId
    };
    
    try {
        // В реальном приложении здесь будет отправка данных на сервер
        console.log('Удаление объявления:', deleteData);
        
        // Отправляем данные в Telegram
        tg.sendData(JSON.stringify(deleteData));
        
        // Закрываем модальное окно
        closeModals();
        
        // Перезагружаем данные на текущей вкладке
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        loadTabData(activeTab);
    } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Произошла ошибка при удалении объявления. Пожалуйста, попробуйте позже.');
    }
}

// Связь с продавцом
function contactSeller(userId, listingTitle) {
    // В реальном приложении здесь будет логика для связи с продавцом через Telegram
    console.log(`Связь с продавцом ${userId} по объявлению "${listingTitle}"`);
    
    // Закрываем модальное окно
    closeModals();
    
    // Здесь может быть код для перенаправления пользователя в чат с продавцом
    alert('Функция связи с продавцом будет доступна в ближайшее время.');
}

// Обработка загрузки изображений
document.querySelectorAll('.image-upload').forEach((input, index) => {
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите изображение.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // В реальном приложении здесь будет загрузка изображения на сервер
            // Для примера используем base64 строку
            uploadedImages[index] = e.target.result;
            updateImagePreviews();
        };
        reader.readAsDataURL(file);
    });
});

// Обновление превью изображений
function updateImagePreviews() {
    document.querySelectorAll('.image-preview').forEach((preview, index) => {
        const label = preview.querySelector('.image-upload-label');
        let existingImg = preview.querySelector('.preview-img');
        let existingRemoveBtn = preview.querySelector('.remove-img');
        
        if (uploadedImages[index]) {
            if (!existingImg) {
                existingImg = document.createElement('img');
                existingImg.className = 'preview-img';
                preview.appendChild(existingImg);
            }
            
            if (!existingRemoveBtn) {
                existingRemoveBtn = document.createElement('span');
                existingRemoveBtn.className = 'remove-img';
                existingRemoveBtn.textContent = 'x';
                existingRemoveBtn.onclick = (e) => {
                    e.stopPropagation();
                    uploadedImages[index] = null;
                    updateImagePreviews();
                };
                preview.appendChild(existingRemoveBtn);
            }
            
            existingImg.src = uploadedImages[index];
            label.style.display = 'none';
        } else {
            if (existingImg) existingImg.remove();
            if (existingRemoveBtn) existingRemoveBtn.remove();
            label.style.display = 'flex';
        }
    });
}

// Счетчик символов в описании
descriptionInput.addEventListener('input', () => {
    const count = descriptionInput.value.length;
    charCount.textContent = count;
    
    if (count > 1000) {
        charCount.style.color = 'red';
    } else {
        charCount.style.color = '';
    }
});

// Обработчики событий
addSellingBtn.addEventListener('click', () => openCreateListingModal('selling'));
addLookingBtn.addEventListener('click', () => openCreateListingModal('looking'));
closeButtons.forEach(btn => btn.addEventListener('click', closeModals));
cancelButtons.forEach(btn => btn.addEventListener('click', closeModals));
listingForm.addEventListener('submit', submitListing);

// Получение моковых данных для объявлений
async function getMockListings(type) {
    // В реальном приложении здесь будет запрос к API
    // Для примера возвращаем моковые данные
    return [
        {
            id: 1,
            user_id: 123456789,
            title: 'Аккаунт ML со всеми героями',
            description: 'Продаю аккаунт Mobile Legends с полной коллекцией героев, 50+ скинов, 10 эпических скинов. Рейтинг Mythic Glory.',
            images: ['https://via.placeholder.com/100x100?text=ML+Account+1', 'https://via.placeholder.com/100x100?text=ML+Account+2'],
            author: 'User123',
            created_at: '2025-03-15T12:30:00',
            type: 'selling'
        },
        {
            id: 2,
            user_id: 987654321,
            title: 'Топовый аккаунт с редкими скинами',
            description: 'Продаю аккаунт с редкими коллекционными скинами, все эмблемы на максимуме, ранг Mythical Glory 1000+',
            images: ['https://via.placeholder.com/100x100?text=ML+Account+3'],
            author: 'MLPlayer',
            created_at: '2025-03-16T10:15:00',
            type: 'selling'
        },
        {
            id: 3,
            user_id: 123123123,
            title: 'Ищу аккаунт с героями-танками',
            description: 'Ищу аккаунт с полной коллекцией героев-танков и их скинами. Готов предложить хорошую цену.',
            images: [],
            author: 'TankLover',
            created_at: '2025-03-17T14:45:00',
            type: 'looking'
        }
    ].filter(listing => listing.type === type);
}

// Получение моковых данных для гарантов
async function getMockGuarantors() {
    // В реальном приложении здесь будет запрос к API
    // Для примера возвращаем моковые данные
    return [
        {
            id: 1,
            name: 'Официальный гарант MobileLegends',
            contact: '@ml_guarantor',
            description: 'Официальный гарант сообщества. Комиссия 5% от суммы сделки.'
        },
        {
            id: 2,
            name: 'Гарант Иван',
            contact: '@ivan_guarantee',
            description: 'Проведено более 500 успешных сделок. Комиссия 3% от суммы сделки.'
        }
    ];
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Инициализация пользовательских данных
function initUserData() {
    // В реальном приложении здесь будет получение данных пользователя
    // Для примера используем моковые данные
    currentUser = {
        id: tg.initDataUnsafe?.user?.id || 12345678,
        is_admin: false,
        is_moderator: false
    };
    
    console.log('User data initialized:', currentUser);
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initUserData();
    loadTabData('selling'); // Загружаем данные для первой вкладки по умолчанию
});

// Обработка событий закрытия при клике вне модального окна
window.addEventListener('click', (event) => {
    if (event.target === createListingModal) {
        closeModals();
    }
    if (event.target === viewListingModal) {
        closeModals();
    }
});

// Блокируем скрытие мини-приложения при свайпе вниз
tg.onEvent('viewportChanged', () => {
    tg.expand();
});