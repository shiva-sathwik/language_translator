# Language Translator

A modern web-based Language Translator application that enables users to translate text between multiple languages, including major Indian regional languages. The application provides a clean and responsive interface with voice input, voice output, translation history, favorites, and customizable settings.

## Features

### Translation

* Translate text between multiple languages
* Support for Indian regional languages
* Language selection dropdowns
* Language swap functionality
* Copy translated text

### User Experience

* Dark Mode / Light Mode
* Responsive Design
* Character Counter
* Loading Indicators

### Data Management

* Translation History
* Favorite Translations
* User Preferences Storage

## Supported Languages

* English
* Hindi
* Telugu
* Tamil
* Kannada
* Malayalam
* Marathi
* Bengali
* Gujarati
* Punjabi

## Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js

### APIs

* Translation API
* Web Speech API

### Storage

* LocalStorage

## Project Structure

```text
language-translator/
│
├── frontend/
│   ├── index.html
│   ├── history.html
│   ├── settings.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── middleware/
│
└── README.md
```

## Installation

### Clone Repository

```bash
git clone https://github.com/shiva-sathwik/language_translator.git
```

### Frontend

Open the frontend folder and run using Live Server.

### Backend

Navigate to backend folder:

```bash
cd backend
npm install
npm start
```

## Usage

1. Select source language.
2. Select target language.
3. Enter text or use voice input.
4. Click Translate.
5. View translated output.
6. Copy or listen to the translated text.

## Future Enhancements

* OCR Image Translation
* File Translation
* AI Grammar Correction
* MongoDB Integration
* User Authentication
* Translation Analytics

## Author

Shiva Sathwik

## License

This project is licensed under the MIT License.
