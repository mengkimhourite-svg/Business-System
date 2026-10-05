# Google Maps and GrabMaps Service Research

## 1. Introduction

### 1.1 Purpose

### 1.2 Research Scope

* Google Maps Platform
* GrabMaps
* Mapping requirements for Autofik

---

## 2. Autofik Mapping Requirements

### 2.1 Customer Location

### 2.2 Mechanic Location

### 2.3 Map Display

### 2.4 Nearby Mechanics

### 2.5 Nearby Garages and Services

### 2.6 Distance Calculation

### 2.7 ETA Calculation

### 2.8 Route Calculation

### 2.9 Navigation

### 2.10 Address and Coordinates

* Geocoding
* Reverse Geocoding

### 2.11 Road and GPS Matching

---

## 3. Google Maps Platform

### 3.1 Maps

* Maps SDK for Android
* Maps SDK for iOS
* Maps JavaScript API
* Maps Embed API
* Maps Static API
* Map Tiles API
* Street View

### 3.2 Places

* Places API
* Place Details
* Nearby Search
* Text Search
* Autocomplete
* Place Photos
* Places Aggregate API

### 3.3 Routes

* Routes API
* Roads API
* Route Optimization API
* Navigation SDK

### 3.4 Location and Address

* Geocoding API
* Geolocation API
* Address Validation API

### 3.5 Other Google Maps Services

* Elevation API
* Time Zone API
* Weather API
* Air Quality API
* Pollen API
* Solar API
* Aerial View API

---

## 4. GrabMaps

### 4.1 Overview

### 4.2 Hyperlocal Base Map Data

### 4.3 Map Service APIs

### 4.4 Map-Making Tools and SaaS

### 4.5 Mapping Capabilities

* Maps
* Roads
* POIs
* Address and location data
* Search
* Geocoding
* Routing
* ETA
* Navigation
* Traffic and incidents
* API/SDK integration

### 4.6 Southeast Asia Coverage

### 4.7 Cambodia Coverage

---

## 5. Google Maps vs GrabMaps

| Feature              | Google Maps | GrabMaps | Autofik Relevance     |
| -------------------- | ----------- | -------- | --------------------- |
| Map Display          | TBD         | TBD      | Customer/Mechanic map |
| GPS Location         | TBD         | TBD      | Real-time location    |
| Places / POI         | TBD         | TBD      | Garages/services      |
| Search               | TBD         | TBD      | Find nearby services  |
| Geocoding            | TBD         | TBD      | Address → coordinates |
| Reverse Geocoding    | TBD         | TBD      | Coordinates → address |
| Routing              | TBD         | TBD      | Mechanic → Customer   |
| Distance             | TBD         | TBD      | Calculate distance    |
| ETA                  | TBD         | TBD      | Estimated arrival     |
| Navigation           | TBD         | TBD      | Mechanic navigation   |
| Road Matching        | TBD         | TBD      | GPS accuracy          |
| Route Optimization   | TBD         | TBD      | Multiple destinations |
| Traffic              | TBD         | TBD      | ETA and routing       |
| API / SDK            | TBD         | TBD      | System integration    |
| Southeast Asia Focus | TBD         | TBD      | Regional coverage     |
| Cambodia Coverage    | TBD         | TBD      | Important for Autofik |
| Pricing              | TBD         | TBD      | Cost consideration    |
| API Limits           | TBD         | TBD      | Scalability           |

---

## 6. Autofik Repository Relationship

### 6.1 SOS Service

`autofik.dev.api.signal-of-service`

Potential mapping use cases:

* Customer location
* Mechanic location
* Real-time GPS
* Distance
* ETA
* Route

### 6.2 Customer Mobile

`autofik.dev.mobile.android.core.native.customer`

Potential mapping use cases:

* Display map
* Customer location
* Mechanic location
* Navigation
* Route display

### 6.3 Service Search

`autofik.dev.api.service.search`

Potential mapping use cases:

* Search nearby services
* Search by location
* Distance-based search

### 6.4 Garage CMS

`autofik.dev.api.garages.cms`

Potential mapping use cases:

* Garage location
* Address
* Coordinates
* Map display

### 6.5 Booking

`autofik.dev.api.booking`

Potential mapping use cases:

* Service location
* Customer location
* Garage location
* Distance and ETA

### 6.6 Booking Garage

`autofik.dev.api.booking-garage`

Potential mapping use cases:

* Garage location
* Route
* Distance
* ETA

> **Note:** A repository being related to a mapping use case does not mean it currently integrates Google Maps or GrabMaps. The source code and configuration should be checked to confirm actual integration.

---

## 7. Possible Mapping Architecture

```text
Customer Mobile
      |
      | HTTPS / WebSocket
      v
    APISIX
      |
      v
Internal Gateway
      |
      +------------------+
      |                  |
      v                  v
   SOS Service      Other Services
      |
      v
Mapping Provider
      |
      +-----------------------+
      |                       |
      v                       v
Google Maps              GrabMaps
```

### 7.1 Mapping Data Flow

```text
Customer GPS
     |
     v
SOS / Backend
     |
     v
Mapping Provider
     |
     +--> Distance
     +--> ETA
     +--> Route
     +--> Address
     +--> Places
     |
     v
Customer / Mechanic
```

---

## 8. Important API Examples

For each API/service, document:

* Service Name
* Purpose
* Input
* Output
* Autofik Use Case
* Pricing
* Limitations
* Documentation

### Example: Routes API

**Purpose:** Calculate a route between locations.

**Input:**

* Origin
* Destination
* Travel mode

**Output:**

* Route
* Distance
* Duration
* Polyline

**Autofik Use Case:**

```text
Mechanic Location
       |
       v
   Routes API
       |
       v
Distance + ETA + Route
       |
       v
Customer / Mechanic App
```

---

## 9. Pricing and Limitations

### 9.1 Google Maps Platform

Check:

* Pricing model
* Free monthly credit
* API request cost
* Quotas
* Rate limits
* SDK restrictions
* Coverage

### 9.2 GrabMaps

Check:

* Pricing model
* API availability
* Request limits
* Coverage
* Integration requirements
* Commercial access requirements

---

## 10. Feature-by-Feature Findings

### 10.1 Map Display

**Google Maps:** TBD

**GrabMaps:** TBD

**Autofik Requirement:** Required

---

### 10.2 Routing

**Google Maps:** TBD

**GrabMaps:** TBD

**Autofik Requirement:** Required

---

### 10.3 ETA

**Google Maps:** TBD

**GrabMaps:** TBD

**Autofik Requirement:** Required

---

### 10.4 Geocoding

**Google Maps:** TBD

**GrabMaps:** TBD

**Autofik Requirement:** Required

---

### 10.5 Places / POI

**Google Maps:** TBD

**GrabMaps:** TBD

**Autofik Requirement:** Required

---

### 10.6 Navigation

**Google Maps:** TBD

**GrabMaps:** TBD

**Autofik Requirement:** To be evaluated

---

## 11. Technical Considerations

When evaluating the providers, check:

1. API availability
2. SDK availability
3. Android support
4. iOS support
5. Backend API support
6. Web support
7. Cambodia coverage
8. Southeast Asia coverage
9. GPS accuracy
10. Routing accuracy
11. ETA accuracy
12. Traffic data
13. POI quality
14. Pricing
15. API limits
16. Data licensing
17. Commercial usage
18. Scalability
19. Documentation
20. Support

---

## 12. Conclusion

Both Google Maps Platform and GrabMaps provide mapping capabilities that may be relevant to Autofik.

The final provider should be evaluated based on:

* Required mapping features
* Cambodia and Southeast Asia coverage
* API and SDK availability
* Routing and ETA capabilities
* POI and search capabilities
* Pricing
* API limits
* Technical integration requirements
* Commercial usage requirements

---

## 13. References

### Google Maps Platform

* Google Maps Platform Documentation
* Google Maps Platform APIs and SDKs
* Google Routes API Documentation
* Google Places API Documentation
* Google Geocoding API Documentation

### GrabMaps

* GrabMaps Documentation
* GrabMaps Solutions
* GrabMaps API Documentation
* GrabMaps Coverage and Availability