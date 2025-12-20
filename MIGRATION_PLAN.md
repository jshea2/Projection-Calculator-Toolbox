# iOS 18 Design System Migration Plan

## Executive Summary

The `ProjectionCalculator` component is a **monolithic ~9,500 line component** that contains all business logic and UI in a single file. It does NOT use Radix UI or shadcn components - instead, it uses **native HTML elements with Tailwind CSS classes**.

**Key Finding:** This is not a component library migration, but a **styling overhaul** of custom HTML elements.

---

## Component Analysis

### 1. Business Logic (KEEP AS IS)

These functions contain pure calculations and should NOT be modified:

| Function                      | Lines   | Purpose                       |
| ----------------------------- | ------- | ----------------------------- |
| `handleWidthInchesChange`     | 226-257 | Unit conversion with rollover |
| `handleHeightInchesChange`    | 259-290 | Unit conversion with rollover |
| `getAspectRatio`              | ~calc   | Aspect ratio calculation      |
| `getPixelPitch`               | ~calc   | Pixel pitch calculation       |
| `getDiagonalSize`             | ~calc   | Diagonal size calculation     |
| `getOptimalViewingDistance`   | ~calc   | Viewing distance calculation  |
| `getFootLamberts`             | ~calc   | Brightness calculation        |
| `calculateRequiredLumens`     | ~calc   | Lumens calculation            |
| `generateResolutionPDF`       | ~5000+  | PDF export                    |
| `generateAspectPDF`           | ~5200+  | PDF export                    |
| `generateThrowPDF`            | ~5400+  | PDF export                    |
| `generateCADPDF`              | ~5700+  | PDF export                    |
| `saveProject` / `loadProject` | ~2800+  | Project persistence           |
| Canvas drawing functions      | ~1500+  | All PDF/canvas rendering      |

### 2. State Management (KEEP AS IS)

~100+ useState hooks managing:
- Project state (currentProjectId, savedProjects, etc.)
- Calculator inputs (measurements, pixels, throw ratios)
- UI state (activeTab, darkMode, modals)
- CAD state (cadProjectors, cadZoom, cadPanOffset)

### 3. Interfaces (KEEP AS IS)

```typescript
interface SavedProject { ... }      // Line 117
interface ProjectSettings { ... }   // Line 126
interface InventoryProjector { ... } // Line 175
interface CadProjector { ... }      // Line 472
```

---

## UI Components Requiring iOS Styling

### Priority 1: Leaf Components (Start Here)

| Component Pattern | Current Implementation          | iOS Replacement         | Effort |
| ----------------- | ------------------------------- | ----------------------- | ------ |
| **Buttons**       | Native `<button>` with Tailwind | `IOSButton`             | 🟢 Low  |
| **Inputs**        | Native `<input>` with Tailwind  | iOS-styled input        | 🟢 Low  |
| **Selects**       | Native `<select>` with Tailwind | iOS-styled select       | 🟢 Low  |
| **Tooltips**      | CSS hover tooltips              | Keep or add iOS popover | 🟢 Low  |

### Priority 2: Compound Components

| Component Pattern      | Current Implementation                          | iOS Replacement              | Effort   |
| ---------------------- | ----------------------------------------------- | ---------------------------- | -------- |
| **Section Cards**      | `<div className="rounded-xl p-4 bg-slate-800">` | `IOSCard`                    | 🟡 Medium |
| **Segmented Controls** | Button groups with toggle state                 | iOS Segmented Control        | 🟡 Medium |
| **Stats Display**      | Grid of values                                  | `IOSCard` with inset variant | 🟡 Medium |

### Priority 3: Complex Components

| Component Pattern   | Current Implementation              | iOS Replacement                  | Effort   |
| ------------------- | ----------------------------------- | -------------------------------- | -------- |
| **Tab Navigation**  | Custom tab bar (lines 6796-6843)    | `IOSTabBar`                      | 🟡 Medium |
| **Rename Modal**    | Fixed overlay div (lines 6565-6594) | `IOSSheet`                       | 🟡 Medium |
| **Inventory Modal** | Fixed overlay div (lines 6596-6785) | `IOSSheet`                       | 🟠 High   |
| **Projector List**  | Div with map (lines 6744-6768)      | `IOSListItem` + `IOSListSection` | 🟡 Medium |

### Priority 4: Page-Level Layout

| Component Pattern       | Current Implementation           | iOS Replacement       | Effort   |
| ----------------------- | -------------------------------- | --------------------- | -------- |
| **Main Container**      | `<div className="min-h-screen">` | Add safe-area padding | 🟢 Low    |
| **Header/Title Bar**    | Custom header div                | iOS navigation style  | 🟡 Medium |
| **Fullscreen CAD View** | Fixed position overlay           | Keep, add iOS styling | 🟡 Medium |

---

## Current UI Pattern → iOS Pattern Mapping

### Buttons

**Current (appears ~50+ times):**
```jsx
<button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Download
</button>
```

**iOS Replacement:**
```jsx
<IOSButton variant="filled" color="blue">
  Download
</IOSButton>
```

### Section Cards

**Current (appears ~15+ times):**
```jsx
<div className={`rounded-xl p-4 sm:p-6 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}>
  {/* content */}
</div>
```

**iOS Replacement:**
```jsx
<IOSCard variant="default" blur padding="md">
  {/* content */}
</IOSCard>
```

### Segmented Controls (Toggle Groups)

**Current (appears ~5+ times):**
```jsx
<div className={`flex items-center rounded-lg p-1 ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}>
  <button className={`flex-1 px-2 py-1 ${active ? "bg-slate-700" : ""}`}>Option A</button>
  <button className={`flex-1 px-2 py-1 ${active ? "bg-slate-700" : ""}`}>Option B</button>
</div>
```

**iOS Replacement:**
```jsx
<IOSSegmentedControl
  options={["Option A", "Option B"]}
  selected={selected}
  onChange={setSelected}
/>
```
*(Note: Need to create `IOSSegmentedControl` component)*

### Modals/Sheets

**Current (appears 2 times):**
```jsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div className="bg-white rounded-xl p-6 w-80">
    {/* content */}
  </div>
</div>
```

**iOS Replacement:**
```jsx
<IOSSheet isOpen={isOpen} onClose={onClose} title="Modal Title" detent="medium">
  {/* content */}
</IOSSheet>
```

### Tab Bar

**Current (lines 6796-6843):**
```jsx
<div className="tab-navigation flex justify-evenly">
  <button onClick={() => setActiveTab("cad")} className={activeTab === "cad" ? "border-blue-600" : ""}>
    <CADIcon />
  </button>
  {/* ... more tabs */}
</div>
```

**iOS Replacement:**
```jsx
<IOSTabBar
  tabs={[
    { id: "cad", label: "Layout", icon: <CADIcon /> },
    { id: "projector", label: "Throw", icon: <ThrowIcon /> },
    { id: "resolution", label: "Surface", icon: <SurfacesIcon /> },
    { id: "aspect", label: "Aspect", icon: <AspectIcon /> },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

### Lists

**Current (lines 6744-6768):**
```jsx
<div className="divide-y">
  {projectorInventory.map(proj => (
    <div key={proj.id} className="p-4 flex items-center gap-4">
      <div className="flex-1">
        <div className="font-medium">{proj.brand} {proj.model}</div>
        <div className="text-sm text-slate-400">{proj.nativeWidth}x{proj.nativeHeight}</div>
      </div>
      <button><Edit3 /></button>
      <button><Trash2 /></button>
    </div>
  ))}
</div>
```

**iOS Replacement:**
```jsx
<IOSListSection header="Projectors">
  {projectorInventory.map(proj => (
    <IOSListItem
      key={proj.id}
      title={`${proj.brand} ${proj.model}`}
      subtitle={`${proj.nativeWidth}x${proj.nativeHeight}`}
      trailing={<ChevronRight />}
      showChevron
      onClick={() => setEditingProjector(proj)}
    />
  ))}
</IOSListSection>
```

---

## Recommended Migration Order

### Phase 1: Foundation (Day 1)
1. ✅ Add iOS CSS variables to `globals.css` (DONE)
2. ✅ Create iOS wrapper components (DONE)
3. Create `IOSSegmentedControl` component (NEW)
4. Create `IOSInput` styled wrapper
5. Create `IOSSelect` styled wrapper

### Phase 2: Leaf Components (Day 2-3)
6. Replace all standalone buttons with `IOSButton`
7. Apply iOS styling to all inputs
8. Apply iOS styling to all selects
9. Replace section cards with `IOSCard`

### Phase 3: Navigation (Day 4)
10. Replace tab navigation with `IOSTabBar`
11. Add safe-area padding to main container
12. Style header/title bar

### Phase 4: Modals & Lists (Day 5-6)
13. Replace Rename Modal with `IOSSheet`
14. Replace Inventory Modal with `IOSSheet`
15. Replace projector list with `IOSListItem`
16. Style CAD projector controls list

### Phase 5: Polish (Day 7)
17. Add haptic feedback data attributes
18. Fine-tune animations
19. Test on device
20. Dark mode verification

---

## Components to Create (Not Yet Built)

| Component             | Description                   | Priority |
| --------------------- | ----------------------------- | -------- |
| `IOSSegmentedControl` | iOS-style toggle button group | 🔴 High   |
| `IOSInput`            | iOS-styled text input wrapper | 🔴 High   |
| `IOSSelect`           | iOS-styled select dropdown    | 🔴 High   |
| `IOSNavBar`           | iOS-style top navigation bar  | 🟡 Medium |
| `IOSToggle`           | iOS-style on/off switch       | 🟢 Low    |

---

## Estimated Effort Summary

| Phase     | Components      | Estimated Time |
| --------- | --------------- | -------------- |
| Phase 1   | Foundation      | 4 hours        |
| Phase 2   | Leaf Components | 8 hours        |
| Phase 3   | Navigation      | 4 hours        |
| Phase 4   | Modals & Lists  | 8 hours        |
| Phase 5   | Polish          | 4 hours        |
| **Total** |                 | **~28 hours**  |

---

## Risk Assessment

### Low Risk
- Replacing buttons, inputs, selects (isolated changes)
- Adding cards wrappers (additive)

### Medium Risk  
- Tab bar replacement (affects navigation state)
- Modal replacement (affects open/close logic)

### High Risk
- None identified - all changes are styling-only

---

## Testing Strategy

1. **Visual Regression**: Screenshot comparisons before/after
2. **Functional Testing**: Ensure all calculations still work
3. **Device Testing**: Test on iPhone with notch for safe areas
4. **Dark Mode**: Verify all components respect dark mode state

---

## Notes

- The component uses a `darkMode` state variable to toggle themes
- All iOS components should check `darkMode` or use CSS variables
- Canvas elements (CAD viewport, test patterns) should NOT be restyled
- PDF generation functions should NOT be modified
- Capacitor integrations (Share, Filesystem, Camera) are unaffected
