# MG Fleet Management System (MG-FMS)

## App Walkthrough & User Guide

**Version:** 1.1.0
**Prepared for:** All Branch Teams (Cavite, QC, Pampanga, Davao, Palawan)
**Date:** April 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started — Login](#2-getting-started--login)
3. [Dashboard](#3-dashboard)
4. [New Assessment](#4-new-assessment)
5. [Inspection Screen](#5-inspection-screen)
6. [Assessment Result](#6-assessment-result)
7. [Preventive Maintenance (PMS)](#7-preventive-maintenance-pms)
8. [Vehicle Profile](#8-vehicle-profile)
9. [History](#9-history)
10. [Analytics](#10-analytics)
11. [Settings](#11-settings)
12. [User Management](#12-user-management)
13. [Key Features](#13-key-features)
14. [Roles & Permissions](#14-roles--permissions)
15. [Inspection Items Reference](#15-inspection-items-reference)
16. [PMS Items Reference](#16-pms-items-reference)
17. [Labor Types Reference](#17-labor-types-reference)
18. [Status & Color Guide](#18-status--color-guide)
19. [Troubleshooting & Support](#19-troubleshooting--support)

---

## 1. Overview

MG-FMS is a mobile-first web application for managing your vehicle fleet. It covers the full lifecycle of fleet maintenance:

- **Vehicle Inspection** — Structured 35+ item checklist across 7 categories
- **Dispatch Clearance** — Automatic pass/fail classification determines if a vehicle can be dispatched
- **Preventive Maintenance** — Track 31 service items with km and date-based intervals
- **Fleet Analytics** — Charts and reports for supervisors and fleet managers
- **User Management** — Role-based access for technicians, supervisors, and fleet managers

The app works **offline-first** — data is cached locally and syncs automatically when connectivity returns.

> ![Screenshot Placeholder: App home screen on mobile]
>
> *Screenshot: MG-FMS Dashboard on mobile — showing vehicle cards with status indicators*

---

## 2. Getting Started — Login

1. Open the app URL in your mobile browser (Chrome recommended)
2. Enter your **email** and **password**
3. Tap **Login**

Your account is created by a Fleet Manager. The first user to ever log in is automatically promoted to Fleet Manager.

> ![Screenshot Placeholder: Login screen]
>
> *Screenshot: Login screen with email/password fields*

**After login:**
- Your role determines what screens you can access
- Your technician name and branch are loaded from your profile
- Assessment and PMS data begins syncing from the server

---

## 3. Dashboard

The Dashboard is your home screen. It shows all vehicles in the fleet with their latest assessment status.

> ![Screenshot Placeholder: Dashboard with vehicle cards]
>
> *Screenshot: Dashboard showing vehicle cards — green (Active), amber (Conditional), red (Deferred)*

### What You See

| Element | Description |
|---------|-------------|
| **Vehicle Card** | Plate number, client, branch, last assessment date |
| **Status Badge** | Color-coded: Active (green), Conditional (amber), Deferred (red) |
| **Health Score** | 0–100 score based on weighted inspection results |
| **Dispatch Icon** | Checkmark if cleared, stop sign if blocked |

### Filtering & Search

- **Status Filter** — Show only Active, Conditional, or Deferred vehicles
- **Branch Filter** — Filter by branch (Cavite, QC, Pampanga, Davao, Palawan)
- **Plate Search** — Type a plate number to find a specific vehicle

### Actions

- **Tap a vehicle card** to open its Vehicle Profile
- **"+ New Assessment"** button to start a new inspection

---

## 4. New Assessment

Start a new vehicle inspection by filling in the assessment header.

> ![Screenshot Placeholder: New Assessment form]
>
> *Screenshot: New Assessment header form — plate, client, branch, odometer, type*

### Header Fields

| Field | Description |
|-------|-------------|
| **Plate Number** | Vehicle plate (e.g., UFF 4915). Auto-fills vehicle info if seen before |
| **Make / Model / Year** | Auto-populated from vehicle registry, or enter manually for new vehicles |
| **Client** | Select from: National Museum, China Banking, Purefoods — San Miguel, or Walk-in |
| **Branch** | Your branch location |
| **Technician** | Your name (from your profile) |
| **Assessment Type** | Initial, Periodic, Re-Assessment, or Pre-Dispatch |
| **Odometer** | Current km reading |
| **Date** | Defaults to today |

### Assessment Types

| Type | What It Does |
|------|-------------|
| **Initial** | Full 35+ item checklist — for vehicles entering the fleet |
| **Periodic** | Full checklist — routine scheduled inspections |
| **Re-Assessment** | Shows ONLY items that failed or were flagged as "Monitor" in the previous inspection |
| **Pre-Dispatch** | Shows ONLY critical, safety, and compliance items — quick check before a vehicle goes out |

After completing the header, tap **Proceed to Inspection** to begin.

---

## 5. Inspection Screen

This is where you perform the actual vehicle inspection, category by category.

> ![Screenshot Placeholder: Inspection screen — category list]
>
> *Screenshot: Inspection screen showing the 7 categories as expandable sections*

### The 7 Inspection Categories

| # | Code | Category | Icon | Items |
|---|------|----------|------|-------|
| 1 | ENG | Engine & Drivetrain | :gear: | 10 items |
| 2 | BRK | Braking System | :stop_sign: | 8 items |
| 3 | SUS | Suspension & Steering | :wrench: | 4 items |
| 4 | ELC | Electrical System | :zap: | 6 items |
| 5 | TIR | Tires & Wheels | :radio_button: | 6 items |
| 6 | BOD | Body & Chassis | :car: | 5 items |
| 7 | LTO | LTO Compliance | :clipboard: | 5 items |

### How to Inspect Each Item

Tap a category to expand it, then for each item:

1. **Select a result code:**

| Code | Meaning | When to Use |
|------|---------|-------------|
| **Pass** | Item is in acceptable condition | No issues found |
| **Monitor** | Minor issue, not critical | Wear or degradation that needs watching |
| **Fail Critical** | Serious defect found | Immediate attention required |
| **Replaced** | Part was replaced on-site | You fixed it during the inspection |
| **N/A** | Not applicable to this vehicle | Item doesn't apply (e.g., ABS on older vehicle) |

2. **For measurable items** (brake pads, tread depth, battery voltage):
   - Enter the measured value
   - The app shows the minimum threshold (e.g., "Min 3.0mm" for brake pads)
   - If below threshold, the item auto-suggests Fail Critical

3. **For Monitor / Fail Critical results:**
   - Select a **defect code** (e.g., Low Thickness, Worn, Leaking, Corroded)
   - Add optional **notes** for details

4. **For Replaced results:**
   - Enter the **part name** that was replaced
   - Enter the **quantity**
   - Optionally enter before/after measurements
   - This **automatically updates the PMS record** for this vehicle

5. **Photos:**
   - Tap the camera icon to capture a photo of the defect
   - Photos are automatically compressed (max 600px, JPEG)
   - A KB size indicator shows in the corner

> ![Screenshot Placeholder: Inspection item with defect code and photo]
>
> *Screenshot: A brake pad item marked as Fail Critical with measured value, defect code, and attached photo*

### Progress Tracking

- Each category shows a completion count (e.g., "8/10 items done")
- Items with issues are highlighted in their respective colors
- You can jump between categories at any time

---

## 6. Assessment Result

After completing all items and submitting, the **classification engine** automatically evaluates the results.

> ![Screenshot Placeholder: Assessment result — ACTIVE status]
>
> *Screenshot: Assessment result showing ACTIVE status with green header and health score*

> ![Screenshot Placeholder: Assessment result — DEFERRED status]
>
> *Screenshot: Assessment result showing DEFERRED status with red header, dispatch blocked, and critical items listed*

### Classification Engine

The engine runs automatically and determines:

| Outcome | Condition | Dispatch? | Reassessment |
|---------|-----------|-----------|-------------|
| **ACTIVE** | All items pass | Cleared | None required |
| **CONDITIONAL** | Has "Monitor" items but no critical failures | Cleared | Within 30 days |
| **DEFERRED** | Has "Fail Critical" items | **BLOCKED** | Within 3 days |

### Health Score (0–100)

A weighted score that reflects overall vehicle condition:

| Item Severity | Fail Critical Deduction | Monitor Deduction |
|--------------|------------------------|-------------------|
| Hold Unit items (brake pads, tire tread, etc.) | -20 points | -5 points |
| Critical items (lights, tie rods, etc.) | -15 points | -5 points |
| Compliance items (LTO docs) | -10 points | -3 points |
| Other items | -8 points | -3 points |

### Actions on the Result Screen

| Action | Description |
|--------|-------------|
| **Share** | Copies a formatted text summary to clipboard — paste into Viber/SMS/email |
| **Quick Fix** | Resolve a failed item (mark as replaced) without redoing the whole inspection |
| **Re-Assess** | Start a new Re-Assessment for this vehicle (only shows previously failed/monitored items) |
| **Supervisor Override** | Supervisors/Fleet Managers can override dispatch decisions |
| **PDF Report** | Generate a printable report |

### RWA Number

Each assessment is assigned a unique **RWA number** in the format `RWA-YYYY-XXXXXX` (e.g., RWA-2026-000145). Use this number for tracking and cross-referencing.

---

## 7. Preventive Maintenance (PMS)

Track scheduled maintenance for each vehicle across 31 service items.

> ![Screenshot Placeholder: PMS screen for a vehicle]
>
> *Screenshot: PMS tracking screen showing service items with urgency indicators*

### PMS Categories

#### Scheduled Maintenance (6 items)
| Item | Interval |
|------|----------|
| Engine Oil | Every 10,000 km or 6 months |
| Oil Filter | Every 10,000 km or 6 months |
| Air Filter | Every 10,000 km or 6 months |
| Cabin Filter | Every 15,000 km or 12 months |
| Fuel Filter | Every 10,000 km or 6 months |
| Brake Cleaning | Every 10,000 km or 6 months |

#### Brake Service (10 items)
| Item | Interval |
|------|----------|
| Brake Pads (Front/Rear) | Every 40,000 km or 24 months |
| Brake Shoes | Every 40,000 km or 24 months |
| Brake Rotors (Front/Rear) | Every 60,000 km or 36 months |
| Brake Drums | Every 60,000 km or 36 months |
| Brake Fluid | Every 40,000 km or 12 months |
| Brake Calipers | Every 60 months |
| Brake Hoses | Every 36 months |
| Reface Rotor Disc | As needed |

#### Scheduled Maintenance — Extended (5 items)
| Item | Interval |
|------|----------|
| Spark Plugs | Every 50,000 km or 48 months |
| Coolant / Radiator Flush | Every 50,000 km or 48 months |
| Transmission Fluid | Every 70,000 km or 48 months |
| Drivebelt | Every 80,000 km or 60 months |
| Differential Oil | Every 40,000 km or 12 months |
| Battery & Terminals | Every 24 months |

#### Major Service (5 items)
| Item | Interval |
|------|----------|
| Timing Belt / Chain | Every 100,000 km or 60 months |
| EGR / Intake Cleaning (Diesel) | Every 50,000 km or 36 months |
| Intake / Throttle Body Cleaning (Petrol) | Every 50,000 km or 36 months |
| Turbo Cleaning | Every 100,000 km or 60 months |
| ATF Dialysis | Every 70,000 km or 48 months |

#### Troubleshooting (6 items)
| Item | When |
|------|------|
| ECU Scanning | As needed |
| Sensor Cleaning | As needed |
| Replace Parts | As needed |
| Rewire | As needed |
| Reprogram | As needed |
| Other (Troubleshooting) | As needed |

### Urgency Color Coding

| Color | Label | Condition |
|-------|-------|-----------|
| **Red (dark)** | Overdue | Past due date OR past due km |
| **Red (light)** | Due Soon | Within 7 days OR 500 km |
| **Amber** | Upcoming | Within 30 days OR 1,500 km |
| **Green** | On Track | More than 30 days and 1,500 km away |

### Recording PMS Work

When you perform a service:
1. Select the vehicle (by plate number)
2. Choose the PMS item
3. Enter current odometer reading
4. The app calculates the next due date and km automatically
5. Records your name, branch, and RWA number

**Auto-linking from inspections:** When you mark an inspection item as "Replaced" (e.g., brake pads), the corresponding PMS record is automatically created/updated.

---

## 8. Vehicle Profile

A complete view of a single vehicle's history and status.

> ![Screenshot Placeholder: Vehicle Profile screen]
>
> *Screenshot: Vehicle Profile showing assessment history, health trend, and PMS status for plate UFF 4915*

### What You See

- **Vehicle Info** — Plate, make, model, year, client, last odometer
- **Current Status** — Latest assessment result and health score
- **Assessment History** — All past inspections for this vehicle, newest first
- **Repeat Defects** — Items that have failed or been flagged across multiple inspections (pattern detection)
- **Measurable Trends** — Graphs showing how brake pad thickness, tread depth, or battery voltage have changed over time
- **PMS Status** — All maintenance items and their due dates for this vehicle

---

## 9. History

A fleet-wide list of all assessments ever submitted.

> ![Screenshot Placeholder: History screen]
>
> *Screenshot: History screen showing a list of all assessments with status badges and filters*

- Filter by **status** (Active / Conditional / Deferred)
- Filter by **branch**
- Search by **plate number**
- Tap any assessment to view its full result

---

## 10. Analytics

Fleet-wide statistics and charts. **Requires Supervisor or Fleet Manager role.**

> ![Screenshot Placeholder: Analytics dashboard with charts]
>
> *Screenshot: Analytics screen showing pie chart of fleet status distribution and bar chart of defects by category*

### Available Charts

- **Fleet Status Distribution** — Pie chart showing Active vs Conditional vs Deferred vehicles
- **Defects by Category** — Bar chart showing which categories have the most issues
- **Branch Comparison** — How each branch is performing
- **Trends Over Time** — Assessment volume and outcomes over time

---

## 11. Settings

> ![Screenshot Placeholder: Settings screen]
>
> *Screenshot: Settings screen showing technician profile, error logs, and app version*

### Options

| Setting | Description |
|---------|-------------|
| **Technician Name** | Your name as it appears on assessments |
| **Branch** | Your assigned branch |
| **Error Logs** | View and copy client-side error logs for troubleshooting |
| **App Version** | Current version (v1.1.0) |

---

## 12. User Management

**Fleet Manager only.** Manage all user accounts.

> ![Screenshot Placeholder: User Management screen]
>
> *Screenshot: User Management screen showing user list with role badges*

### Capabilities

- View all registered users
- Change user roles (Technician / Supervisor / Fleet Manager)
- Assign users to branches
- View user email and profile information

---

## 13. Key Features

### Offline-First Operation
Data is cached locally using Firebase persistent cache with multi-tab support. You can:
- Start an inspection with no internet
- Data syncs automatically when connectivity returns
- A status indicator shows connection state (Connected / Reconnecting)

### Session Restore
If the app is accidentally refreshed or the browser crashes mid-inspection:
- Your in-progress work is saved to session storage
- Reopening the app resumes exactly where you left off
- Applies to: inspection screen, assessment headers, item results, expanded categories

### Auto-Fill Vehicle Info
- When you enter a plate number, the app checks the vehicle registry
- Make, model, year, and client are auto-filled from previous assessments
- Saves time on repeat inspections

### Photo Documentation
- Tap the camera icon on any inspection item to capture a photo
- Photos are automatically compressed (max 600px dimension, JPEG quality 0.5)
- A KB size overlay shows the compressed file size
- Photos are stored inline with the assessment in Firestore

### Auto-Link Inspections to PMS
When you mark an inspection item as "Replaced":
- The corresponding PMS record is automatically created or updated
- Maps include: Oil, Oil Filter, Air Filter, Cabin Filter, Spark Plugs, Fuel Filter, Drivebelt, Coolant, Transmission Fluid, Brake Pads (F/R), Brake Drum, Brake Shoes, Brake Fluid, Battery

### Share Assessment Results
The Share button generates a clean text summary:
```
MG FLEET ASSESSMENT RESULT
RWA No.: RWA-2026-000145
Plate:   ZOQ 3492
Client:  National Museum of the Philippines
Branch:  MGQUEZON CITY
Date:    2026-03-23
STATUS:  ACTIVE
CLEARED FOR DISPATCH
```

---

## 14. Roles & Permissions

| Feature | Technician | Supervisor | Fleet Manager |
|---------|:----------:|:----------:|:-------------:|
| Dashboard | Yes | Yes | Yes |
| New Assessment | Yes | Yes | Yes |
| Inspection | Yes | Yes | Yes |
| PMS Tracking | Yes | Yes | Yes |
| Vehicle Profile | Yes | Yes | Yes |
| History | Yes | Yes | Yes |
| Analytics | No | Yes | Yes |
| Supervisor Override | No | Yes | Yes |
| User Management | No | No | Yes |
| Export | No | Yes | Yes |

---

## 15. Inspection Items Reference

### Engine & Drivetrain (ENG) — 10 Items
| Code | Item | Type | Critical | Hold Unit |
|------|------|------|:--------:|:---------:|
| ENG_OIL | Engine oil — condition & level | Condition | No | No |
| ENG_OIL_FILTER | Oil filter — condition & replace | Condition | No | No |
| ENG_COOL | Coolant level & condition | Condition | No | No |
| ENG_MOUNT | Engine mounts — no excessive vibration | Condition | No | No |
| ENG_TRANS | Transmission fluid level | Condition | No | No |
| ENG_BELT | Drive belts condition | Condition | No | No |
| ENG_AIR | Air filter condition | Condition | No | No |
| ENG_CABIN | Cabin filter condition | Condition | No | No |
| ENG_SPARK | Spark plugs condition | Condition | No | No |
| ENG_FUEL | Fuel system — no visible leaks | Condition | **Yes** | **Yes** |

### Braking System (BRK) — 8 Items
| Code | Item | Type | Critical | Hold Unit | Threshold |
|------|------|------|:--------:|:---------:|-----------|
| BRK_PAD_F | Brake pad thickness — front | Measurable | **Yes** | **Yes** | Min 3.0mm |
| BRK_PAD_R | Brake pad thickness — rear | Measurable | **Yes** | **Yes** | Min 3.0mm |
| BRK_ROTOR | Brake rotors / drums | Condition | No | No | — |
| BRK_DRUM | Brake drum condition | Condition | No | No | — |
| BRK_SHOE | Brake shoe condition | Condition | **Yes** | **Yes** | — |
| BRK_FLUID | Brake fluid level | Condition | No | No | — |
| BRK_HAND | Handbrake effectiveness | Condition | **Yes** | **Yes** | — |
| BRK_ABS | ABS warning light | Condition | No | No | — |

### Suspension & Steering (SUS) — 4 Items
| Code | Item | Type | Critical | Hold Unit |
|------|------|------|:--------:|:---------:|
| SUS_SHOCK | Shock absorbers — no leaks | Condition | No | No |
| SUS_TIE | Tie rods and ball joints | Condition | **Yes** | **Yes** |
| SUS_PS | Power steering fluid | Condition | No | No |
| SUS_ALIGN | Steering wheel play & alignment | Condition | No | No |

### Electrical System (ELC) — 6 Items
| Code | Item | Type | Critical | Hold Unit | Threshold |
|------|------|------|:--------:|:---------:|-----------|
| ELC_BATT_V | Battery voltage | Measurable | No | No | Min 12.0V |
| ELC_BATT | Battery condition & terminals | Condition | No | No | — |
| ELC_LIGHTS | All exterior lights functioning | Condition | **Yes** | No | — |
| ELC_WIPER | Wipers and washer system | Condition | No | No | — |
| ELC_HORN | Horn functioning | Condition | No | No | — |
| ELC_DASH | Dashboard — no active warnings | Condition | No | No | — |

### Tires & Wheels (TIR) — 6 Items
| Code | Item | Type | Critical | Hold Unit | Threshold |
|------|------|------|:--------:|:---------:|-----------|
| TIR_TREAD_F | Front tire tread depth | Measurable | **Yes** | **Yes** | Min 1.6mm |
| TIR_TREAD_R | Rear tire tread depth | Measurable | **Yes** | **Yes** | Min 1.6mm |
| TIR_PSI | Tire inflation — all tires | Condition | No | No | — |
| TIR_SIDE | Sidewall condition | Condition | **Yes** | **Yes** | — |
| TIR_SPARE | Spare tire condition & pressure | Condition | No | No | — |
| TIR_NUTS | Wheel nuts — properly torqued | Condition | **Yes** | **Yes** | — |

### Body & Chassis (BOD) — 5 Items
| Code | Item | Type | Critical | Hold Unit |
|------|------|------|:--------:|:---------:|
| BOD_STRUCT | Structural integrity | Condition | **Yes** | **Yes** |
| BOD_UNDER | Undercarriage — no major corrosion | Condition | No | No |
| BOD_DOOR | Door, window, lock operation | Condition | No | No |
| BOD_BELT | Seat belts — all functioning | Condition | **Yes** | **Yes** |
| BOD_WIND | Windshield — no obstructing cracks | Condition | **Yes** | No |

### LTO Compliance (LTO) — 5 Items
| Code | Item | Type | Compliance |
|------|------|------|:----------:|
| LTO_REG | Registration — current & valid | Condition | **Yes** |
| LTO_ORCR | OR/CR on board | Condition | **Yes** |
| LTO_EMIS | Emission sticker — current | Condition | **Yes** |
| LTO_MVIS | MVIS certificate — current | Condition | **Yes** |
| LTO_INS | Third-party insurance — current | Condition | **Yes** |

---

## 16. PMS Items Reference

| Code | Item | KM Interval | Month Interval | Category |
|------|------|:-----------:|:--------------:|----------|
| PMS_OIL | Engine Oil | 10,000 | 6 | Scheduled |
| PMS_OIL_FILTER | Oil Filter | 10,000 | 6 | Scheduled |
| PMS_AIR | Air Filter | 10,000 | 6 | Scheduled |
| PMS_CABIN | Cabin Filter | 15,000 | 12 | Scheduled |
| PMS_FUEL | Fuel Filter | 10,000 | 6 | Scheduled |
| PMS_BRAKE_CLEAN | Brake Cleaning | 10,000 | 6 | Scheduled |
| PMS_SPARK | Spark Plugs | 50,000 | 48 | Scheduled |
| PMS_COOL | Coolant / Radiator Flush | 50,000 | 48 | Scheduled |
| PMS_TRANS | Transmission Fluid | 70,000 | 48 | Scheduled |
| PMS_DRIVEBELT | Drivebelt | 80,000 | 60 | Scheduled |
| PMS_DIFF | Differential Oil | 40,000 | 12 | Scheduled |
| PMS_BATT | Battery & Terminals | — | 24 | Scheduled |
| PMS_BRAKE_PAD_F | Brake Pads Front | 40,000 | 24 | Brake |
| PMS_BRAKE_PAD_R | Brake Pads Rear | 40,000 | 24 | Brake |
| PMS_BRAKE_SHOE | Brake Shoes | 40,000 | 24 | Brake |
| PMS_BRAKE_ROTOR_F | Brake Rotor Front | 60,000 | 36 | Brake |
| PMS_BRAKE_ROTOR_R | Brake Rotor Rear | 60,000 | 36 | Brake |
| PMS_BRAKE_DRUM | Brake Drum | 60,000 | 36 | Brake |
| PMS_BRAKE_FLUID | Brake Fluid | 40,000 | 12 | Brake |
| PMS_BRAKE_CAL | Brake Caliper | — | 60 | Brake |
| PMS_BRAKE_HOSE | Brake Hose | — | 36 | Brake |
| PMS_BRAKE_REFACE | Reface Rotor Disc | — | — | Brake |
| PMS_TIMING | Timing Belt / Chain | 100,000 | 60 | Major |
| PMS_EGR | EGR / Intake Cleaning (Diesel) | 50,000 | 36 | Major |
| PMS_INTAKE | Intake / Throttle Body (Petrol) | 50,000 | 36 | Major |
| PMS_TURBO | Turbo Cleaning | 100,000 | 60 | Major |
| PMS_ATF | ATF Dialysis | 70,000 | 48 | Major |
| PMS_ECU | ECU Scanning | — | — | Troubleshooting |
| PMS_SENSOR | Sensor Cleaning | — | — | Troubleshooting |
| PMS_PARTS | Replace Parts | — | — | Troubleshooting |
| PMS_REWIRE | Rewire | — | — | Troubleshooting |
| PMS_REPROG | Reprogram | — | — | Troubleshooting |
| PMS_OTHER_T | Other (Troubleshooting) | — | — | Troubleshooting |

---

## 17. Labor Types Reference

When recording PMS work, select the labor type that best describes the service performed:

| Code | Labor Type |
|------|-----------|
| LBR_PMS | Preventive Maintenance Service |
| LBR_DIAG | Diagnostic / ECU Scanning |
| LBR_TROUBLESHOOT | Troubleshooting |
| LBR_ENGINE | Engine Repair |
| LBR_BRAKE | Brake Service |
| LBR_SUSPENSION | Suspension & Steering Repair |
| LBR_ELECTRICAL | Electrical Repair |
| LBR_TIRE | Tire Service / Replacement |
| LBR_BODY | Body & Chassis Repair |
| LBR_OIL | Oil Change / Fluid Service |
| LBR_FILTER | Filter Replacement |
| LBR_BELT | Belt / Hose Replacement |
| LBR_AC | Air Conditioning Service |
| LBR_ALIGN | Wheel Alignment / Balancing |
| LBR_REWIRE | Rewiring / Harness Repair |
| LBR_REPROG | Reprogramming / ECU Update |
| LBR_OTHER | Other |

---

## 18. Status & Color Guide

### Vehicle Assessment Status

| Status | Color | Meaning | Dispatch |
|--------|-------|---------|----------|
| **ACTIVE** | Green | All items pass — vehicle is roadworthy | Cleared |
| **CONDITIONAL** | Amber | Has monitored items — needs follow-up | Cleared (reassess in 30 days) |
| **DEFERRED** | Red | Has critical failures — not roadworthy | **BLOCKED** (reassess in 3 days) |

### Inspection Item Results

| Result | Color | Meaning |
|--------|-------|---------|
| **Pass** | Green | Item is in acceptable condition |
| **Monitor** | Amber | Minor issue — needs watching |
| **Fail Critical** | Red | Serious defect — needs immediate action |
| **Replaced** | Blue | Part was replaced during inspection |
| **N/A** | Gray | Not applicable to this vehicle |

### Action Recommendations

| Action | Color | Triggered By |
|--------|-------|-------------|
| No Action | Green | Pass, N/A, or Replaced items |
| Monitor | Amber | Monitor result on any item |
| Repair Required | Orange | Fail Critical on compliance or standard items |
| Repair Immediately | Red | Fail Critical on critical items |
| Hold Unit | Dark Red | Fail Critical on hold-unit items (brakes, tires, structural) |

### PMS Urgency

| Level | Color | Condition |
|-------|-------|-----------|
| **Overdue** | Red | Past due date or past due km |
| **Due Soon** | Red (light) | Within 7 days or 500 km |
| **Upcoming** | Amber | Within 30 days or 1,500 km |
| **On Track** | Green | More than 30 days and 1,500 km |

---

## 19. Troubleshooting & Support

### Common Issues

| Problem | Solution |
|---------|---------|
| App shows "Reconnecting" | Check internet connection. Data is cached — you can continue working offline |
| Assessment not saving | Check connection status. Pending writes sync automatically when back online |
| Photos not loading | Large photos may take time on slow connections. Photos are compressed to ~50-100KB |
| Login fails | Verify email and password. Contact your Fleet Manager if locked out |
| App crashes | Error is auto-logged. Go to Settings > Error Logs, copy the details, and send to your administrator |

### Error Reporting

1. Go to **Settings**
2. Scroll to **Error Logs**
3. Tap **Copy Error Details**
4. Send the copied text to your app administrator

### App Info

- **App Version:** 1.1.0
- **Platform:** Web (mobile-optimized)
- **Backend:** Firebase (Firestore + Authentication)
- **Offline Support:** Yes — persistent local cache with multi-tab support

---

*MG Fleet Management System (FMS) — fleet.mastergarage.ph*
*Master Garage Auto Services*
