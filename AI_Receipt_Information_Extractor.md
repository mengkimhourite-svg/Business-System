#                           AI Receipt Information Extractor

## 1. Project Overview 

### Project Title

**AI Receipt Information Extractor Using OCR, NLP, and Machine Learning**

### Project Type

Introduction to AI and Machine Learning

### Project Goal

The system automatically extracts useful information from receipt images using Artificial Intelligence and Machine Learning techniques.

### Information to Extract

* Store Name
* Receipt Date
* Item Name
* Quantity
* Item Price
* Total Amount

---

# 2. Problem Statement

Receipt information is usually stored as unstructured text in images. Manually reading and entering this information is time-consuming and can cause errors.

This project develops an AI system that automatically converts receipt images into structured information.

---

# 3. Project Objectives

The system should:

1. Upload a receipt image.
2. Preprocess the image.
3. Extract text using OCR.
4. Clean and process the extracted text.
5. Analyze text using NLP.
6. Classify receipt fields using Machine Learning.
7. Extract structured receipt information.
8. Validate the extracted information.
9. Provide confidence information where available.
10. Allow manual correction when necessary.
11. Store the final result.
12. Display the extracted information to the user.
13. Evaluate the AI/ML performance.

---

# 4. System Features

## 4.1 Receipt Upload

Users can upload receipt images.

Supported formats:

* JPG
* JPEG
* PNG

Flow:

```text
User
 ↓
Select Receipt
 ↓
Upload Image
```

---

## 4.2 Receipt Preview

Display the uploaded receipt before processing.

```text
Upload Receipt
      ↓
Preview Image
      ↓
Analyze Receipt
```

---

## 4.3 Image Preprocessing

Improve the receipt image before OCR.

Processing steps:

```text
Original Image
      ↓
Resize
      ↓
Grayscale
      ↓
Noise Removal
      ↓
Contrast Enhancement
      ↓
Thresholding
      ↓
Rotation / Deskew
      ↓
Processed Image
```

Technology:

* OpenCV

---

## 4.4 Optical Character Recognition (OCR)

OCR converts text from the receipt image into machine-readable text.

```text
Receipt Image
      ↓
OCR
      ↓
Raw Text
```

Possible OCR engines:

* Tesseract OCR
* PaddleOCR

Example:

```text
ABC MARKET
21/09/2026

Chicken Nuggets 2 7.00
Milk 1 2.50

TOTAL 9.50
```

---

## 4.5 Text Cleaning

Clean OCR output before NLP and Machine Learning.

Tasks:

* Remove unnecessary spaces
* Normalize characters
* Normalize numbers
* Separate text lines
* Handle common OCR errors

Flow:

```text
Raw OCR Text
      ↓
Text Cleaning
      ↓
Normalized Text
```

---

## 4.6 Natural Language Processing (NLP)

NLP analyzes and processes the extracted receipt text.

Tasks:

* Tokenization
* Text normalization
* Date detection
* Number detection
* Keyword detection
* Pattern identification
* Entity identification

Example:

```text
TOTAL 9.50
```

The system identifies:

```text
TOTAL → Field
9.50  → Amount
```

Possible technologies:

* NLTK
* spaCy

---

# 5. Dataset Preparation

Machine Learning requires a labeled dataset.

## 5.1 Dataset Structure

```text
data/
├── images/
│   ├── receipt_001.jpg
│   ├── receipt_002.jpg
│   └── ...
│
└── labels/
    ├── receipt_001.json
    ├── receipt_002.json
    └── ...
```

---

## 5.2 Dataset Collection

Collect receipts with different:

* Store layouts
* Fonts
* Dates
* Items
* Prices
* Number of items
* Image qualities
* Lighting conditions
* Orientations

---

## 5.3 Dataset Labeling

Each receipt should contain the correct expected information.

Example:

```json
{
  "store": "ABC Market",
  "date": "21/09/2026",
  "items": [
    {
      "name": "Chicken Nuggets",
      "quantity": 2,
      "price": 7.00
    }
  ],
  "total": 7.00
}
```

---

## 5.4 Dataset Splitting

Split the dataset into:

```text
Training Dataset
Validation Dataset
Testing Dataset
```

Purpose:

| Dataset    | Purpose                    |
| ---------- | -------------------------- |
| Training   | Train the ML model         |
| Validation | Tune and improve the model |
| Testing    | Evaluate the final model   |

---

# 6. Receipt Information Classification

The system should classify receipt information into:

```text
STORE
DATE
ITEM
QUANTITY
PRICE
TOTAL
OTHER
```

Example:

```text
ABC MARKET
     ↓
STORE

21/09/2026
     ↓
DATE

Chicken Nuggets
     ↓
ITEM

2
     ↓
QUANTITY

7.00
     ↓
PRICE

9.50
     ↓
TOTAL
```

---

# 7. Machine Learning

## 7.1 Machine Learning Pipeline

```text
Labeled Dataset
      ↓
Text Preprocessing
      ↓
Feature Extraction
      ↓
TF-IDF
      ↓
ML Model
      ↓
Trained Model
```

---

## 7.2 Feature Extraction

Use TF-IDF to convert text into numerical features.

```text
Receipt Text
      ↓
TF-IDF
      ↓
Numerical Features
```

---

## 7.3 ML Model

Start with:

```text
TF-IDF
   +
Logistic Regression
```

The model classifies text into:

```text
STORE
DATE
ITEM
QUANTITY
PRICE
TOTAL
OTHER
```

---

# 8. Model Training

Training process:

```text
Labeled Data
      ↓
Text Preprocessing
      ↓
TF-IDF
      ↓
Training
      ↓
Logistic Regression
      ↓
Trained Model
```

The model learns patterns from the labeled dataset.

---

# 9. Model Evaluation

Evaluate the trained model using:

* Accuracy
* Precision
* Recall
* F1-score
* Confusion Matrix

Example:

```text
Actual: DATE
Predicted: DATE
```

Correct.

```text
Actual: DATE
Predicted: PRICE
```

Incorrect.

The final evaluation values must come from the actual test dataset.

---

# 10. Model Saving

Save the trained model for future predictions.

```text
models/
├── receipt_classifier.pkl
├── tfidf_vectorizer.pkl
└── config.json
```

Flow:

```text
Training
   ↓
Save Model
   ↓
Load Model
   ↓
Prediction
```

---

# 11. Information Extraction

After classification, extract the required receipt fields.

### Store

```text
ABC MARKET
↓
Store = ABC MARKET
```

### Date

```text
21/09/2026
↓
Date = 21/09/2026
```

### Item

```text
Chicken Nuggets
↓
Item = Chicken Nuggets
```

### Quantity

```text
2
↓
Quantity = 2
```

### Price

```text
7.00
↓
Price = 7.00
```

### Total

```text
TOTAL 9.50
↓
Total = 9.50
```

---

# 12. Receipt Validation

Validate extracted information before saving.

Checks:

* Store name exists
* Date has a valid format
* Quantity is valid
* Price is valid
* Total is valid
* Item information is complete

Flow:

```text
Extracted Data
      ↓
Validation
      ↓
Valid?
   ↙     ↘
 Yes      No
 ↓         ↓
Save     Review
```

---

# 13. Confidence and Manual Review

When confidence information is available, use it to identify uncertain predictions.

```text
AI Prediction
      ↓
Confidence Check
      ↓
 ┌────┴─────┐
High       Low
 ↓          ↓
Save      Review
            ↓
        User Correction
            ↓
           Save
```

Example:

```text
Store: ABC Market
Date: 21/09/2026
Item: Chicken Nugget5  ← Review
Quantity: 2
Price: 7.00
```

The user can correct the uncertain field.

---

# 14. Structured JSON Result

The final result should be returned as structured JSON.

```json
{
  "store": "ABC Market",
  "date": "21/09/2026",
  "items": [
    {
      "name": "Chicken Nuggets",
      "quantity": 2,
      "price": 7.00
    },
    {
      "name": "Milk",
      "quantity": 1,
      "price": 2.50
    }
  ],
  "total": 9.50
}
```

---

# 15. Complete AI Pipeline

```text
Receipt Image
      ↓
Image Preprocessing
      ↓
OCR
      ↓
Raw Text
      ↓
Text Cleaning
      ↓
NLP
      ↓
Feature Extraction
      ↓
TF-IDF
      ↓
Machine Learning
      ↓
Field Classification
      ↓
Information Extraction
      ↓
Validation
      ↓
Structured JSON
```

---

# 16. Backend API

Use FastAPI to provide the AI service.

### Main Endpoint

```text
POST /api/receipt/analyze
```

### Input

```text
Receipt Image
```

### Processing

```text
Image
 ↓
Preprocessing
 ↓
OCR
 ↓
NLP
 ↓
ML
 ↓
Extraction
 ↓
Validation
```

### Output

```text
Structured JSON
```

---

# 17. Backend Structure

```text
backend/
├── app/
│   ├── main.py
│   │
│   ├── routes/
│   │   └── receipt.py
│   │
│   ├── services/
│   │   ├── preprocessing.py
│   │   ├── ocr.py
│   │   ├── nlp.py
│   │   ├── ml.py
│   │   ├── extraction.py
│   │   └── validation.py
│   │
│   └── schemas/
│       └── receipt.py
│
└── requirements.txt
```

---

# 18. Frontend

Use:

* React
* TypeScript

Main features:

```text
Upload Receipt
      ↓
Preview Receipt
      ↓
Analyze Receipt
      ↓
Show Processing Status
      ↓
Display Result
      ↓
Edit Result
      ↓
Save Result
```

---

# 19. Frontend Structure

```text
frontend/
├── src/
│   ├── components/
│   │   ├── ReceiptUpload.tsx
│   │   ├── ReceiptPreview.tsx
│   │   ├── ProcessingStatus.tsx
│   │   ├── ReceiptResult.tsx
│   │   └── ReceiptEditor.tsx
│   │
│   ├── pages/
│   │   └── ReceiptExtractor.tsx
│   │
│   └── services/
│       └── receiptApi.ts
```

---

# 20. Database

Use SQLite for a simple project.

PostgreSQL can be used if a larger deployment is required.

## receipts

```text
id
store_name
receipt_date
total_amount
image_path
created_at
```

## receipt_items

```text
id
receipt_id
item_name
quantity
price
```

Relationship:

```text
Receipt
   │
   ├── Item 1
   ├── Item 2
   └── Item 3
```

---

# 21. Receipt History

Store processed receipts so users can view previous results.

Example:

```text
Date          Store          Total
------------------------------------
21/09/2026    ABC Market     $9.50
20/09/2026    XYZ Store      $12.00
19/09/2026    Mini Mart      $8.50
```

---

# 22. Testing

Test the system using different receipt conditions.

### Test Cases

1. Clear receipt
2. Blurry receipt
3. Rotated receipt
4. Dark receipt
5. Low-contrast receipt
6. Receipt with many items
7. Receipt with one item
8. Different date formats
9. Different price formats
10. Different store layouts
11. OCR errors
12. Incorrect or missing fields
13. Complete end-to-end processing

---

# 23. Testing Flow

```text
Test Receipt
      ↓
Image Processing
      ↓
OCR
      ↓
Text Cleaning
      ↓
NLP
      ↓
ML Prediction
      ↓
Information Extraction
      ↓
Validation
      ↓
Database
      ↓
Frontend
```

---

# 24. Project Development Order

Follow this order during development:

```text
1. Define Requirements
        ↓
2. Setup Project
        ↓
3. Collect Dataset
        ↓
4. Label Dataset
        ↓
5. Split Dataset
        ↓
6. Build Image Preprocessing
        ↓
7. Implement OCR
        ↓
8. Clean OCR Text
        ↓
9. Implement NLP
        ↓
10. Create ML Dataset
        ↓
11. Feature Extraction with TF-IDF
        ↓
12. Train ML Model
        ↓
13. Evaluate ML Model
        ↓
14. Save ML Model
        ↓
15. Build Information Extraction
        ↓
16. Build Validation
        ↓
17. Integrate AI Pipeline
        ↓
18. Build FastAPI
        ↓
19. Build React Frontend
        ↓
20. Add Database
        ↓
21. Connect Frontend + Backend
        ↓
22. Add Manual Review
        ↓
23. Test Complete System
        ↓
24. Evaluate Results
        ↓
25. Documentation
        ↓
26. Final Demo
```

---

# 25. Project Folder Structure

```text
ai-receipt-extractor/
│
├── backend/
├── frontend/
│
├── data/
│   ├── images/
│   ├── labels/
│   ├── train/
│   ├── validation/
│   └── test/
│
├── models/
│
├── notebooks/
│
├── tests/
│
├── docs/
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

# 26. Technologies

| Technology            | Purpose                 |
| --------------------- | ----------------------- |
| Python                | AI/ML development       |
| OpenCV                | Image preprocessing     |
| Tesseract / PaddleOCR | OCR                     |
| NLTK / spaCy          | NLP                     |
| Pandas                | Dataset processing      |
| NumPy                 | Numerical processing    |
| Scikit-learn          | Machine Learning        |
| TF-IDF                | Text feature extraction |
| Logistic Regression   | Text classification     |
| FastAPI               | Backend API             |
| React                 | Frontend                |
| TypeScript            | Frontend programming    |
| SQLite                | Database                |
| Git                   | Version control         |

---

# 27. Final System Architecture

```text
                         USER
                           │
                           ▼
                  ┌─────────────────┐
                  │ React Frontend  │
                  └────────┬────────┘
                           │
                     Receipt Image
                           │
                           ▼
                  ┌─────────────────┐
                  │ FastAPI Backend │
                  └────────┬────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │      AI Pipeline       │
              │                        │
              │ Image Processing       │
              │ OCR                    │
              │ Text Cleaning          │
              │ NLP                    │
              │ Feature Extraction     │
              │ Machine Learning       │
              │ Information Extraction │
              │ Validation             │
              └───────────┬────────────┘
                          │
                          ▼
                  Structured Receipt
                          │
                 ┌────────┴────────┐
                 ▼                 ▼
             Database          JSON Result
                                   │
                                   ▼
                            React Frontend
                                   │
                                   ▼
                                  USER
```

---

# 28. Final User Flow

```text
Open System
     ↓
Upload Receipt
     ↓
Preview Receipt
     ↓
Click Analyze
     ↓
Image Preprocessing
     ↓
OCR
     ↓
NLP
     ↓
Machine Learning
     ↓
Information Extraction
     ↓
Validation
     ↓
Review Result
     ↓
Correct if Necessary
     ↓
Save Receipt
     ↓
View Result / History
```

---

# 29. Final Deliverables

At the end of the project, the following should be completed:

* [ ] Project documentation
* [ ] Receipt dataset
* [ ] Dataset labels
* [ ] Image preprocessing module
* [ ] OCR module
* [ ] NLP module
* [ ] ML training code
* [ ] Trained ML model
* [ ] Model evaluation
* [ ] Information extraction module
* [ ] Validation module
* [ ] FastAPI backend
* [ ] React frontend
* [ ] Database
* [ ] API integration
* [ ] Testing
* [ ] Final results
* [ ] Final presentation/demo

---

# 30. Final AI/ML Demonstration

The main concept demonstrated by the project is:

```text
                 RECEIPT IMAGE
                       │
                       ▼
                COMPUTER VISION
                       │
                       ▼
                  OCR → TEXT
                       │
                       ▼
                     NLP
                       │
                       ▼
              FEATURE EXTRACTION
                       │
                       ▼
              MACHINE LEARNING
                       │
                       ▼
               FIELD CLASSIFICATION
                       │
                       ▼
             INFORMATION EXTRACTION
                       │
                       ▼
                  VALIDATION
                       │
                       ▼
              STRUCTURED RECEIPT
```

The project demonstrates how Artificial Intelligence and Machine Learning can be used to transform an unstructured receipt image into structured and usable information.
