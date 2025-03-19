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
const titleInput = document.getElementById('listing-title');
const accountIdInput = document.getElementById('account-id');
const zoneIdInput = document.getElementById('zone-id');
const priceInput = document.getElementById('price-input');
const priceLabel = document.getElementById('price-label');
const priceHint = document.getElementById('price-hint');
const descriptionInput = document.getElementById('listing-description');
const charCount = document.getElementById('char-count');
const closeButtons = document.querySelectorAll('.close');
const cancelButtons = document.querySelectorAll('.cancel-btn');
const deleteListingBtn = document.getElementById('delete-listing-btn');
const contactSellerBtn = document.getElementById('contact-seller-btn');
const filterToggles = document.querySelectorAll('.filter-toggle');
const filterDropdowns = document.querySelectorAll('.filter-dropdown');
const clearFiltersButtons = document.querySelectorAll('.clear-filters-btn');
const applyFiltersButtons = document.querySelectorAll('.apply-filters-btn');
const sellingSearchInput = document.getElementById('selling-search');
const lookingSearchInput = document.getElementById('looking-search');

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
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>';
    
    try {
        // В реальном приложении здесь будет запрос к API
        // Для примера используем моковые данные
        const mockListings = await getMockListings(type);
        
        if (mockListings.length === 0) {
            container.innerHTML = `<p class="no-data"><i class="fas fa-info-circle"></i> Нет ${type === 'selling' ? 'объявлений о продаже' : 'запросов на покупку'}</p>`;
            return;
        }
        
        container.innerHTML = '';
        mockListings.forEach(listing => {
            const card = createListingCard(listing);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading listings:', error);
        container.innerHTML = '<p class="error"><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки данных. Пожалуйста, попробуйте позже.</p>';
    }
}

// Создание карточки объявления
function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    if (listing.images && listing.images.length > 0) {
        card.classList.add('has-images');
    }
    
    let listingContent = `
        <div class="listing-id-badge">ID: ${listing.id}</div>
        <div class="listing-title">${listing.title}</div>
        <div class="listing-account-ids">
            <span class="listing-account-id"><i class="fas fa-id-card"></i> ${listing.account_id || 'Не указан'}</span>
            <span class="listing-zone-id"><i class="fas fa-map-marker-alt"></i> ${listing.zone_id || 'Не указан'}</span>
            <span class="listing-price"><i class="fas fa-${listing.type === 'selling' ? 'tag' : 'wallet'}"></i> ${formatPrice(listing.price)}</span>
        </div>
    `;
    
    if (listing.images && listing.images.length > 0) {
        listingContent += `<img class="listing-thumbnail" src="${listing.images[0]}" alt="Preview">`;
    }
    
    listingContent += `
        <div class="listing-preview">${listing.description}</div>
        <div class="listing-meta">
            <span class="listing-author"><i class="fas fa-user"></i> ${listing.author}</span>
            <span class="listing-date"><i class="fas fa-calendar-alt"></i> ${formatDate(listing.created_at)}</span>
        </div>
    `;
    
    card.innerHTML = listingContent;
    
    card.addEventListener('click', () => {
        openListingDetails(listing);
    });
    
    return card;
}

// Форматирование цены
function formatPrice(price) {
    if (!price) return 'Не указана';
    
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
    }).format(price);
}

// Получение ценовой категории
function getPriceCategory(price) {
    if (!price) return null;
    
    if (price < 5000) return '0-4999';
    if (price < 10000) return '5000-9999';
    if (price < 20000) return '10000-19999';
    if (price < 40000) return '20000-39999';
    return '40000+';
}

// Открытие деталей объявления
function openListingDetails(listing) {
    const titleEl = document.getElementById('view-listing-title');
    const idEl = document.getElementById('view-listing-id');
    const accountIdEl = document.getElementById('view-account-id');
    const zoneIdEl = document.getElementById('view-zone-id');
    const priceEl = document.getElementById('view-price');
    const priceLabelEl = document.getElementById('view-price-label');
    const imagesContainer = document.getElementById('view-listing-images');
    const descriptionEl = document.getElementById('view-listing-description');
    const authorEl = document.getElementById('view-listing-author');
    const dateEl = document.getElementById('view-listing-date');
    
    titleEl.textContent = listing.title;
    idEl.textContent = listing.id;
    accountIdEl.textContent = listing.account_id || 'Не указан';
    zoneIdEl.textContent = listing.zone_id || 'Не указан';
    priceEl.textContent = formatPrice(listing.price);
    priceLabelEl.textContent = listing.type === 'selling' ? 'Цена:' : 'Бюджет:';
    descriptionEl.textContent = listing.description;
    authorEl.textContent = listing.author;
    dateEl.textContent = formatDate(listing.created_at);
    
    // Очищаем контейнер с изображениями
    imagesContainer.innerHTML = '';
    
    // Добавляем изображения, если они есть
    if (listing.images && listing.images.length > 0) {
        imagesContainer.style.display = 'flex';
        listing.images.forEach(imageUrl => {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'listing-image-wrapper';
            
            const img = document.createElement('img');
            img.className = 'listing-image';
            img.src = imageUrl;
            img.alt = 'Изображение объявления';
            
            imgWrapper.appendChild(img);
            imagesContainer.appendChild(imgWrapper);
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
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>';
    
    try {
        // В реальном приложении здесь будет запрос к API
        // Для примера используем моковые данные
        const mockGuarantors = await getMockGuarantors();
        
        if (mockGuarantors.length === 0) {
            container.innerHTML = '<p class="no-data"><i class="fas fa-info-circle"></i> Список гарантов пуст</p>';
            return;
        }
        
        container.innerHTML = '';
        mockGuarantors.forEach(guarantor => {
            const card = document.createElement('div');
            card.className = 'guarantor-card';
            card.innerHTML = `
                <div class="guarantor-name"><i class="fas fa-shield-alt"></i> ${guarantor.name}</div>
                <div class="guarantor-contact"><i class="fas fa-comment-alt"></i> ${guarantor.contact}</div>
                <div class="guarantor-description">${guarantor.description}</div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading guarantors:', error);
        container.innerHTML = '<p class="error"><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки данных. Пожалуйста, попробуйте позже.</p>';
    }
}

// Открытие модального окна создания объявления
function openCreateListingModal(type) {
    // Сбрасываем форму
    listingForm.reset();
    uploadedImages = [];
    updateImagePreviews();
    
    // Сбрасываем сообщения об ошибках
    clearValidationErrors();
    
    // Устанавливаем тип объявления
    listingTypeInput.value = type;
    
    // Устанавливаем заголовок модального окна
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = type === 'selling' ? 'Добавить объявление о продаже' : 'Добавить запрос на покупку';
    
    // Обновляем поле цены в зависимости от типа объявления
    updatePriceFieldByListingType();
    
    // Обновляем счетчик символов
    updateCharCount();
    
    // Открываем модальное окно
    createListingModal.style.display = 'block';
}

// Закрытие модальных окон
function closeModals() {
    createListingModal.style.display = 'none';
    viewListingModal.style.display = 'none';
}

// Очистка сообщений об ошибках валидации
function clearValidationErrors() {
    const errorMessages = document.querySelectorAll('.validation-error');
    errorMessages.forEach(el => el.remove());
    
    const errorFields = document.querySelectorAll('.error-field');
    errorFields.forEach(el => el.classList.remove('error-field'));
}

// Отображение ошибки валидации
function showValidationError(field, message) {
    // Удаляем предыдущую ошибку если есть
    const existingError = field.parentNode.querySelector('.validation-error');
    if (existingError) {
        existingError.remove();
    }
    
    field.classList.add('error-field');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
    
    return false;
}

// Валидация формы
function validateForm() {
    let isValid = true;
    
    clearValidationErrors();
    
    // Валидация заголовка
    if (!titleInput.value.trim()) {
        isValid = showValidationError(titleInput, 'Заголовок обязателен');
    }
    
    // Валидация ID аккаунта (6-11 цифр)
    const accountIdValue = accountIdInput.value.trim();
    if (!accountIdValue) {
        isValid = showValidationError(accountIdInput, 'ID аккаунта обязателен');
    } else if (!/^\d{6,11}$/.test(accountIdValue)) {
        isValid = showValidationError(accountIdInput, 'ID аккаунта должен содержать от 6 до 11 цифр');
    }
    
    // Валидация Zone ID (4-7 цифр)
    const zoneIdValue = zoneIdInput.value.trim();
    if (!zoneIdValue) {
        isValid = showValidationError(zoneIdInput, 'Zone ID обязателен');
    } else if (!/^\d{4,7}$/.test(zoneIdValue)) {
        isValid = showValidationError(zoneIdInput, 'Zone ID должен содержать от 4 до 7 цифр');
    }
    
    // Валидация цены
    const priceValue = priceInput.value.trim();
    if (!priceValue) {
        isValid = showValidationError(priceInput, listingTypeInput.value === 'selling' ? 'Цена обязательна' : 'Бюджет обязателен');
    } else if (isNaN(parseFloat(priceValue)) || parseFloat(priceValue) < 0) {
        isValid = showValidationError(priceInput, 'Укажите корректную сумму');
    }
    
    // Валидация описания
    if (!descriptionInput.value.trim()) {
        isValid = showValidationError(descriptionInput, 'Описание обязательно');
    } else if (descriptionInput.value.length > 1000) {
        isValid = showValidationError(descriptionInput, 'Описание не должно превышать 1000 символов');
    }
    
    return isValid;
}

// Обработка смены типа объявления
function updatePriceFieldByListingType() {
    const type = listingTypeInput.value;
    
    if (type === 'selling') {
        priceLabel.textContent = 'Цена:';
        priceHint.textContent = 'Укажите стоимость аккаунта в рублях';
        document.getElementById('view-price-label').textContent = 'Цена:';
    } else {
        priceLabel.textContent = 'Бюджет:';
        priceHint.textContent = 'Укажите ваш бюджет в рублях';
        document.getElementById('view-price-label').textContent = 'Бюджет:';
    }
}

// Отправка объявления
async function submitListing(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const title = titleInput.value.trim();
    const accountId = accountIdInput.value.trim();
    const zoneId = zoneIdInput.value.trim();
    const price = parseFloat(priceInput.value.trim());
    const description = descriptionInput.value.trim();
    const type = listingTypeInput.value;
    
    // Создаем объект с данными
    const listingData = {
        action: 'add_listing',
        type: type,
        title: title,
        account_id: accountId,
        zone_id: zoneId,
        price: price,
        description: description,
        images: uploadedImages
    };
    
    try {
        // Показываем индикатор загрузки
        const submitBtn = document.querySelector('.submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        submitBtn.disabled = true;
        
        // В реальном приложении здесь будет отправка данных на сервер
        console.log('Отправка объявления:', listingData);
        
        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Отправляем данные в Telegram
        tg.sendData(JSON.stringify(listingData));
        
        // Восстанавливаем кнопку
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        // Закрываем модальное окно
        closeModals();
        
        // Перезагружаем данные на текущей вкладке
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        loadTabData(activeTab);
        
        // Показываем уведомление об успехе
        showNotification('Объявление успешно отправлено!', 'success');
    } catch (error) {
        console.error('Error submitting listing:', error);
        
        // Восстанавливаем кнопку
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        showNotification('Произошла ошибка при отправке объявления. Пожалуйста, попробуйте позже.', 'error');
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
        // Показываем индикатор загрузки
        const deleteBtn = document.getElementById('delete-listing-btn');
        const originalBtnText = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Удаление...';
        deleteBtn.disabled = true;
        
        // В реальном приложении здесь будет отправка данных на сервер
        console.log('Удаление объявления:', deleteData);
        
        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Отправляем данные в Telegram
        tg.sendData(JSON.stringify(deleteData));
        
        // Восстанавливаем кнопку
        deleteBtn.innerHTML = originalBtnText;
        deleteBtn.disabled = false;
        
        // Закрываем модальное окно
        closeModals();
        
        // Перезагружаем данные на текущей вкладке
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        loadTabData(activeTab);
        
        // Показываем уведомление об успехе
        showNotification('Объявление успешно удалено!', 'success');
    } catch (error) {
        console.error('Error deleting listing:', error);
        
        // Восстанавливаем кнопку
        const deleteBtn = document.getElementById('delete-listing-btn');
        deleteBtn.innerHTML = originalBtnText;
        deleteBtn.disabled = false;
        
        showNotification('Произошла ошибка при удалении объявления. Пожалуйста, попробуйте позже.', 'error');
    }
}

// Связь с продавцом
function contactSeller(userId, listingTitle) {
    // В реальном приложении здесь будет логика для связи с продавцом через Telegram
    console.log(`Связь с продавцом ${userId} по объявлению "${listingTitle}"`);
    
    // Закрываем модальное окно
    closeModals();
    
    // Здесь может быть код для перенаправления пользователя в чат с продавцом
    tg.openTelegramLink(`https://t.me/${userId}`);
}

// Обработка загрузки изображений
document.querySelectorAll('.image-upload').forEach((input, index) => {
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showNotification('Пожалуйста, выберите изображение.', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB max
            showNotification('Размер изображения не должен превышать 5MB.', 'error');
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
                existingRemoveBtn.innerHTML = '<i class="fas fa-times"></i>';
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

// Обновление счетчика символов в описании
function updateCharCount() {
    const count = descriptionInput.value.length;
    charCount.textContent = count;
    
    if (count > 1000) {
        charCount.style.color = 'var(--danger-color)';
    } else if (count > 800) {
        charCount.style.color = 'var(--warning-color)';
    } else {
        charCount.style.color = '';
    }
}

// Счетчик символов в описании
descriptionInput.addEventListener('input', updateCharCount);

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Анимируем появление
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Добавляем стили для уведомлений
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 12px 20px;
        border-radius: 8px;
        background-color: var(--tg-theme-secondary-bg-color);
        color: var(--tg-theme-text-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 90%;
        transition: transform 0.3s ease;
    }
    
    .notification.show {
        transform: translateX(-50%) translateY(0);
    }
    
    .notification.success {
        background-color: #d4edda;
        color: #155724;
    }
    
    .notification.error {
        background-color: #f8d7da;
        color: #721c24;
    }
    
    .notification.warning {
        background-color: #fff3cd;
        color: #856404;
    }
    
    .notification i {
        font-size: 1.2em;
    }
    
    .error-field {
        border-color: var(--danger-color) !important;
    }
    
    .validation-error {
        color: var(--danger-color);
        font-size: 0.8rem;
        margin-top: 5px;
        display: flex;
        align-items: center;
        gap: 5px;
    }
`;
document.head.appendChild(notificationStyle);

// Обработчики событий
addSellingBtn.addEventListener('click', () => openCreateListingModal('selling'));
addLookingBtn.addEventListener('click', () => openCreateListingModal('looking'));
closeButtons.forEach(btn => btn.addEventListener('click', closeModals));
cancelButtons.forEach(btn => btn.addEventListener('click', closeModals));
listingForm.addEventListener('submit', submitListing);

// Отслеживаем изменение типа объявления
listingTypeInput.addEventListener('change', updatePriceFieldByListingType);

// Обработчики для фильтров
filterToggles.forEach((toggle, index) => {
    toggle.addEventListener('click', () => {
        const dropdown = filterDropdowns[index];
        dropdown.classList.toggle('active');
    });
});

// Закрытие выпадающего списка фильтров при клике вне его
document.addEventListener('click', (event) => {
    if (!event.target.closest('.filters')) {
        filterDropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});

// Очистка фильтров
clearFiltersButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const filterOptions = event.target.closest('.filter-dropdown').querySelectorAll('input[type="checkbox"]');
        filterOptions.forEach(checkbox => {
            checkbox.checked = false;
        });
    });
});

// Применение фильтров
applyFiltersButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const dropdown = event.target.closest('.filter-dropdown');
        dropdown.classList.remove('active');
        
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        loadTabData(activeTab);
    });
});

// Поиск по ключевым словам
sellingSearchInput.addEventListener('input', debounce(() => {
    loadListings('selling');
}, 500));

lookingSearchInput.addEventListener('input', debounce(() => {
    loadListings('looking');
}, 500));

// Функция debounce для предотвращения частых вызовов
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Загрузка объявлений с учетом фильтров и поиска
async function loadListings(type) {
    const container = document.getElementById(`${type}-listings`);
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>';
    
    try {
        // В реальном приложении здесь будет запрос к API с фильтрами
        const mockListings = await getMockListings(type);
        
        // Получаем значение поиска
        const searchQuery = (type === 'selling' ? sellingSearchInput.value : lookingSearchInput.value).trim().toLowerCase();
        
        // Получаем выбранные ценовые фильтры
        const priceFilters = Array.from(
            document.querySelectorAll(`input[name="${type === 'selling' ? 'price' : 'budget'}-filter"]:checked`)
        ).map(input => input.value);
        
        // Фильтруем объявления
        const filteredListings = mockListings.filter(listing => {
            // Фильтр по поиску
            if (searchQuery) {
                const matchesSearch = 
                    listing.title.toLowerCase().includes(searchQuery) || 
                    listing.description.toLowerCase().includes(searchQuery) ||
                    listing.author.toLowerCase().includes(searchQuery);
                
                if (!matchesSearch) return false;
            }
            
            // Фильтр по цене
            if (priceFilters.length > 0) {
                const priceCategory = getPriceCategory(listing.price);
                if (!priceFilters.includes(priceCategory)) return false;
            }
            
            return true;
        });
        
        if (filteredListings.length === 0) {
            container.innerHTML = `<p class="no-data"><i class="fas fa-info-circle"></i> ${
                searchQuery || priceFilters.length > 0 
                    ? 'Нет объявлений, соответствующих вашему поиску' 
                    : `Нет ${type === 'selling' ? 'объявлений о продаже' : 'запросов на покупку'}`
            }</p>`;
            return;
        }
        
        container.innerHTML = '';
        filteredListings.forEach(listing => {
            const card = createListingCard(listing);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading listings:', error);
        container.innerHTML = '<p class="error"><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки данных. Пожалуйста, попробуйте позже.</p>';
    }
}

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
            images: ['https://via.placeholder.com/300x300?text=ML+Account+1', 'https://via.placeholder.com/300x300?text=ML+Account+2'],
            author: 'User123',
            created_at: '2025-03-15T12:30:00',
            type: 'selling',
            account_id: '123456789',
            zone_id: '12345',
            price: 15000
        },
        {
            id: 2,
            user_id: 987654321,
            title: 'Топовый аккаунт с редкими скинами',
            description: 'Продаю аккаунт с редкими коллекционными скинами, все эмблемы на максимуме, ранг Mythical Glory 1000+',
            images: ['https://via.placeholder.com/300x300?text=ML+Account+3'],
            author: 'MLPlayer',
            created_at: '2025-03-16T10:15:00',
            type: 'selling',
            account_id: '987654321',
            zone_id: '54321',
            price: 45000
        },
        {
            id: 3,
            user_id: 123123123,
            title: 'Ищу аккаунт с героями-танками',
            description: 'Ищу аккаунт с полной коллекцией героев-танков и их скинами. Готов предложить хорошую цену.',
            images: [],
            author: 'TankLover',
            created_at: '2025-03-17T14:45:00',
            type: 'looking',
            account_id: '123123123',
            zone_id: '12312',
            price: 8000
        },
        {
            id: 4,
            user_id: 444555666,
            title: 'Аккаунт с легендарными скинами',
            description: 'Продаю аккаунт ML с 5 легендарными скинами, все эпические герои разблокированы. Ранг Mythic.',
            images: ['https://via.placeholder.com/300x300?text=ML+Legendary'],
            author: 'LegendaryPlayer',
            created_at: '2025-03-18T09:20:00',
            type: 'selling',
            account_id: '444555666',
            zone_id: '44455',
            price: 25000
        },
        {
            id: 5,
            user_id: 777888999,
            title: 'Ищу аккаунт с коллекционными скинами',
            description: 'Ищу аккаунт с редкими коллекционными скинами. Бюджет ограничен, но готов обсудить.',
            images: [],
            author: 'SkinCollector',
            created_at: '2025-03-18T16:45:00',
            type: 'looking',
            account_id: '777888999',
            zone_id: '77788',
            price: 3000
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
            description: 'Официальный гарант сообщества. Комиссия 5% от суммы сделки. Проведено более 1000 успешных сделок.'
        },
        {
            id: 2,
            name: 'Гарант Иван',
            contact: '@ivan_guarantee',
            description: 'Проведено более 500 успешных сделок. Комиссия 3% от суммы сделки. Работаю ежедневно с 10:00 до 22:00.'
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

// Адаптация интерфейса при смене темы Telegram
tg.onEvent('themeChanged', () => {
    applyTelegramStyles();
});
