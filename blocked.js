// Array of funny images to rotate through
const funnyImages = [
    'assets/images/187f46f7-d841-4b61-b440-b2e940c10c4d.jpg',
    'assets/images/2d1de817-228b-4e02-96ff-c03df65b6240.jpg',
    'assets/images/8070b3c9-48cd-439e-a379-925d5e738501.jpg',
    'assets/images/8c2fb052-f811-4967-ac37-8ef82d2d6d33.jpg',
    'assets/images/9d7c5bae-6ffa-4f2e-a160-6ea1f7e58510.jpg',
    'assets/images/aa247fa5-56aa-4055-bce6-1d1526e63cb4.jpg',
    'assets/images/ae14c554-9dd1-4cea-88c7-e5f10485c185.jpg',
    'assets/images/cf287578-f2d7-4a8a-9b4b-31c7c3672dd8.jpg',
    'assets/images/dd3c3a51-7daa-4d43-bce9-d847599c3f40.jpg'
];

// Function to get a random image from the array
function getRandomImage() {
    const randomIndex = Math.floor(Math.random() * funnyImages.length);
    return funnyImages[randomIndex];
}

// Function to get query parameters from the URL
function getQueryParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const regex = /([^&=]+)=([^&]*)/g;
    let match;
    while (match = regex.exec(queryString)) {
        params[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
    }
    return params;
}

// Get the blocked URL from the query parameters and display it
const params = getQueryParams();
const blockedUrl = params.blockedUrl || 'unknown';
const blockedUrlElement = document.getElementById('blocked-url');
if (blockedUrlElement) {
    blockedUrlElement.textContent = blockedUrl;
}

// Set a random funny image
const imgElement = document.getElementById('funny-image');
if (imgElement) {
    imgElement.src = getRandomImage();
}

// Handle "Allow this time" button
const allowBtn = document.getElementById('allow-btn');
if (allowBtn) {
    allowBtn.addEventListener('click', () => {
        allowBtn.disabled = true;
        allowBtn.textContent = 'Redirecting...';
        
        // Send message to background script to allow this URL
        // The background will use sender.tab to get the tabId
        chrome.runtime.sendMessage({
            action: 'allowThisTime',
            // We don't have the full URL here, but background has it stored by tabId
        }, (response) => {
            if (response && response.success) {
                // Background will handle the redirect
                console.log('Allow this time successful');
            } else {
                console.error('Allow this time failed:', response?.error);
                allowBtn.disabled = false;
                allowBtn.textContent = 'Allow this time';
                alert('Failed to allow: ' + (response?.error || 'Unknown error'));
            }
        });
    });
}
