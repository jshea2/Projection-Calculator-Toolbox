import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Download,
  FileText,
  Camera,
  Upload,
  X,
  HelpCircle,
  Info,
  Ruler,
  ArrowLeftRight,
  FileUp,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  Move,
  RotateCw,
  Hand,
  ChevronDown,
  Save,
  FolderOpen,
  Plus,
  Trash2,
  RefreshCw,
  Edit3,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  Grid3x3,
  Video,
  Grid2x2,
  RectangleVertical,
  Menu,
} from "lucide-react";
import { IOSButton, IOSCard, IOSInput, IOSSelect, IOSTabBar } from "./ios";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import appIcon from "../assets/app-icon.png";

// ============================================
// FEATURE FLAGS - Set to false to hide features
// ============================================
const ENABLE_CAD_TAB = true; // Set to false to hide CAD tab for release

// Custom SVG Icons
const SurfacesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Calculator */}
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <circle cx="8" cy="10" r="1" fill="currentColor" />
    <circle cx="12" cy="10" r="1" fill="currentColor" />
    <circle cx="16" cy="10" r="1" fill="currentColor" />
    <circle cx="8" cy="14" r="1" fill="currentColor" />
    <circle cx="12" cy="14" r="1" fill="currentColor" />
    <circle cx="16" cy="14" r="1" fill="currentColor" />
    <circle cx="8" cy="18" r="1" fill="currentColor" />
    <circle cx="12" cy="18" r="1" fill="currentColor" />
    <circle cx="16" cy="18" r="1" fill="currentColor" />
  </svg>
);

const ThrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Beam expanding from projector point to screen */}
    <path d="M2 12 L20 4 L20 20 Z" fill="currentColor" opacity="0.2" />
    {/* Beam outline lines going to screen */}
    <line x1="2" y1="12" x2="20" y2="4" />
    <line x1="2" y1="12" x2="20" y2="20" />
    {/* Screen */}
    <line x1="20" y1="2" x2="20" y2="22" strokeWidth="3" />
  </svg>
);

const AspectIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Square border */}
    <rect x="3" y="3" width="18" height="18" rx="2" />
    {/* Arrow from top-right pointing inward */}
    <path d="M17 7 L13 11 M17 7 L13 7 M17 7 L17 11" />
    {/* Arrow from bottom-left pointing inward */}
    <path d="M7 17 L11 13 M7 17 L11 17 M7 17 L7 13" />
  </svg>
);

const CADIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    {/* Blue drafting triangle / set square - right angle at bottom-left */}
    {/* Using path with cutout (evenodd) to make center transparent */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 22 L2 2 L22 22 Z M5 19 L5 11 L13 19 Z"
    />
    {/* Ruler tick marks - PERPENDICULAR to hypotenuse (crossing at 90°) */}
    {/* Diagonal is 45° down-right, so perpendicular is 45° up-right */}
    <g stroke="white" strokeLinecap="round">
      <line x1="3.5" y1="5" x2="5" y2="3.5" strokeWidth="1.5" />
      <line x1="5.5" y1="7" x2="6.5" y2="6" strokeWidth="1" />
      <line x1="7.5" y1="9" x2="9" y2="7.5" strokeWidth="1.5" />
      <line x1="9.5" y1="11" x2="10.5" y2="10" strokeWidth="1" />
      <line x1="11.5" y1="13" x2="13" y2="11.5" strokeWidth="1.5" />
      <line x1="13.5" y1="15" x2="14.5" y2="14" strokeWidth="1" />
      <line x1="15.5" y1="17" x2="17" y2="15.5" strokeWidth="1.5" />
      <line x1="17.5" y1="19" x2="18.5" y2="18" strokeWidth="1" />
      <line x1="19.5" y1="21" x2="20.5" y2="20" strokeWidth="1.5" />
    </g>
  </svg>
);

// Project interface for saving/loading
interface SavedProject {
  id: string;
  name: string;
  lastModified: string;
  pdfFileName?: string;
  pdfData?: string; // Base64-encoded PDF data for persistence
  settings: ProjectSettings;
}

interface ProjectSettings {
  // Surface Resolution tab
  measurementWidth: string;
  measurementHeight: string;
  widthFeet: string;
  widthInches: string;
  heightFeet: string;
  heightInches: string;
  pixelWidth: string;
  pixelHeight: string;
  unit: "inches" | "cm" | "feet" | "meters";
  lumens: string;
  screenGain: string;
  testPatternName: string;
  patternMode: "light" | "dark";
  // Throw Distance tab
  throwRatio: string;
  zoomEnabled: boolean;
  throwRatioMin: string;
  throwRatioMax: string;
  projectorOrientation: "landscape" | "portrait";
  projectorAspectRatio: string;
  projectorNativeWidth: string;
  projectorNativeHeight: string;
  diagramView: "plan" | "section";
  projectorMode: "single" | "stacked" | "blended";
  projectorCount: number;
  blendOverlap: number;
  blendScaleMode: "width" | "height";
  // Export tab
  projectTitle: string;
  projectNotes: string;
  clientName: string;
  // CAD tab
  cadScale: string;
  cadCustomScale: string;
  cadScaleMode: "architect" | "custom";
  cadProjectors: any[];
  cadSelectedProjector: number;
  cadScreenWidth: number;
  cadLockMode: "screen" | "projector";
  cadViewMode: "plan" | "section";
  cadUnit: "inches" | "cm" | "feet" | "meters";
  cadCurrentPage: number;
  cadZoom: number;
  cadPanOffset: { x: number; y: number };
  cadRotation: number;
}

// Projector Inventory interface
interface InventoryProjector {
  id: string;
  brand: string;
  model: string;
  nativeWidth: string;
  nativeHeight: string;
  lensType: "fixed" | "zoom";
  throwRatioMin: string;
  throwRatioMax: string;  // same as min for fixed lens
  lumens: string;
}

const STORAGE_KEY = "projectionCalc_projects";
const CURRENT_PROJECT_KEY = "projectionCalc_currentProject";
const INVENTORY_KEY = "projectionCalc_projectorInventory";

export function ProjectionCalculator() {
  // ============================================
  // PROJECT MANAGEMENT STATE
  // ============================================
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>("Untitled Project");
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [projectMenuOpen, setProjectMenuOpen] = useState<boolean>(false);
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [renameValue, setRenameValue] = useState<string>("");
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Projector Inventory state
  const [projectorInventory, setProjectorInventory] = useState<InventoryProjector[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState<boolean>(false);
  const [editingProjector, setEditingProjector] = useState<InventoryProjector | null>(null);
  const [selectedInventoryProjector, setSelectedInventoryProjector] = useState<string>("custom"); // "custom" or projector id

  // Store as decimal values internally
  const [measurementWidth, setMeasurementWidth] =
    useState<string>("16");
  const [measurementHeight, setMeasurementHeight] =
    useState<string>("9");

  // Separate feet/inches inputs
  const [widthFeet, setWidthFeet] = useState<string>("16");
  const [widthInches, setWidthInches] = useState<string>("0");
  const [heightFeet, setHeightFeet] = useState<string>("9");
  const [heightInches, setHeightInches] = useState<string>("0");

  // Handlers for feet/inches with rollover logic
  const handleWidthInchesChange = (value: string) => {
    const inches = parseFloat(value) || 0;
    const currentFeet = parseFloat(widthFeet) || 0;

    if (inches >= 12) {
      // Roll over to feet
      const additionalFeet = Math.floor(inches / 12);
      const remainingInches = inches % 12;
      setWidthFeet((currentFeet + additionalFeet).toString());
      setWidthInches(remainingInches.toString());
    } else if (inches < 0 && currentFeet > 0) {
      // Borrow from feet
      const feetToBorrow = Math.ceil(Math.abs(inches) / 12);
      const newFeet = currentFeet - feetToBorrow;
      const newInches = 12 - (Math.abs(inches) % 12);
      if (newFeet >= 0) {
        setWidthFeet(newFeet.toString());
        setWidthInches(
          (newInches === 12 ? 0 : newInches).toString(),
        );
      } else {
        // Don't go below 0 feet 0 inches
        setWidthFeet("0");
        setWidthInches("0");
      }
    } else if (inches < 0) {
      // Don't allow negative if no feet to borrow from
      setWidthInches("0");
    } else {
      setWidthInches(value);
    }
  };

  const handleHeightInchesChange = (value: string) => {
    const inches = parseFloat(value) || 0;
    const currentFeet = parseFloat(heightFeet) || 0;

    if (inches >= 12) {
      // Roll over to feet
      const additionalFeet = Math.floor(inches / 12);
      const remainingInches = inches % 12;
      setHeightFeet((currentFeet + additionalFeet).toString());
      setHeightInches(remainingInches.toString());
    } else if (inches < 0 && currentFeet > 0) {
      // Borrow from feet
      const feetToBorrow = Math.ceil(Math.abs(inches) / 12);
      const newFeet = currentFeet - feetToBorrow;
      const newInches = 12 - (Math.abs(inches) % 12);
      if (newFeet >= 0) {
        setHeightFeet(newFeet.toString());
        setHeightInches(
          (newInches === 12 ? 0 : newInches).toString(),
        );
      } else {
        // Don't go below 0 feet 0 inches
        setHeightFeet("0");
        setHeightInches("0");
      }
    } else if (inches < 0) {
      // Don't allow negative if no feet to borrow from
      setHeightInches("0");
    } else {
      setHeightInches(value);
    }
  };

  const [pixelWidth, setPixelWidth] = useState<string>("1920");
  const [pixelHeight, setPixelHeight] = useState<string>("");
  const [unit, setUnit] = useState<
    "inches" | "cm" | "feet" | "meters"
  >("feet");
  const [previousUnit, setPreviousUnit] = useState<
    "inches" | "cm" | "feet" | "meters"
  >("feet");

  // New states for additional calculations
  const [lumens, setLumens] = useState<string>("12000");
  const [screenGain, setScreenGain] = useState<string>("1");
  const [testPatternName, setTestPatternName] =
    useState<string>("Test Pattern");
  const [throwRatio, setThrowRatio] = useState<string>("1.5");
  const [patternMode, setPatternMode] = useState<
    "light" | "dark"
  >("light");

  // Zoom lens states
  const [zoomEnabled, setZoomEnabled] = useState<boolean>(true);
  const [throwRatioMin, setThrowRatioMin] =
    useState<string>("1.2");
  const [throwRatioMax, setThrowRatioMax] =
    useState<string>("1.8");

  // Projector specs states
  const [projectorOrientation, setProjectorOrientation] =
    useState<"landscape" | "portrait">("landscape");
  const [projectorAspectRatio, setProjectorAspectRatio] =
    useState<string>("16:9");
  const [projectorNativeWidth, setProjectorNativeWidth] =
    useState<string>("1920");
  const [projectorNativeHeight, setProjectorNativeHeight] =
    useState<string>("1080");
  const [diagramView, setDiagramView] = useState<
    "plan" | "section"
  >("plan");

  // Multiple projector states
  const [projectorMode, setProjectorMode] = useState<
    "single" | "stacked" | "blended"
  >("single");
  const [projectorCount, setProjectorCount] =
    useState<number>(2);
  const [blendOverlap, setBlendOverlap] = useState<number>(20);
  const [blendScaleMode, setBlendScaleMode] = useState<
    "width" | "height"
  >("width");

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "resolution" | "projector" | "aspect" | "cad"
  >("cad");
  const [previousTab, setPreviousTab] = useState<
    "resolution" | "projector" | "aspect" | "cad"
  >("cad");

  // Tab change handler with direction tracking
  const handleTabChange = (newTab: "resolution" | "projector" | "aspect" | "cad") => {
    setPreviousTab(activeTab);
    setActiveTab(newTab);
  };

  // Helper to get slide direction based on tab order
  const getSlideDirection = (tab: "resolution" | "projector" | "aspect" | "cad") => {
    const tabOrder = ["cad", "projector", "resolution", "aspect"];
    // Use previousTab to determine direction since activeTab has already changed
    const currentIndex = tabOrder.indexOf(previousTab);
    const newIndex = tabOrder.indexOf(tab);
    const direction = newIndex > currentIndex ? "tabSlideInRight" : "tabSlideInLeft";
    console.log(`Tab transition: ${previousTab} → ${tab}, direction: ${direction}`);
    return direction;
  };

  // Export fields
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [projectNotes, setProjectNotes] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");

  // Lock orientation based on active tab
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      if (activeTab === "aspect") {
        // Allow all orientations on Aspect Ratio tab
        ScreenOrientation.unlock();
      } else {
        // Lock to portrait on all other tabs
        ScreenOrientation.lock({ orientation: "portrait" });
      }
    }
  }, [activeTab]);

  // Aspect Ratio Estimator states
  const [estimatorImage, setEstimatorImage] = useState<
    string | null
  >(null);
  const [aspectRatioApplied, setAspectRatioApplied] =
    useState(false);
  const [rectangleCorners, setRectangleCorners] = useState({
    topLeft: { x: 100, y: 100 },
    topRight: { x: 400, y: 100 },
    bottomRight: { x: 400, y: 300 },
    bottomLeft: { x: 100, y: 300 },
  });
  const [draggingCorner, setDraggingCorner] = useState<
    string | null
  >(null);
  const [showCamera, setShowCamera] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Reference rectangle overlay
  const [showReferenceRect, setShowReferenceRect] =
    useState(false);
  const [referenceRect, setReferenceRect] = useState({
    x: 150,
    y: 150,
    width: 300,
  });
  const [draggingReference, setDraggingReference] = useState<
    "move" | "resize" | null
  >(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedAspectRatio, setSelectedAspectRatio] =
    useState("16:9");

  const aspectRatios: { [key: string]: number } = {
    "16:9": 16 / 9,
    "16:10": 16 / 10,
    "4:3": 4 / 3,
    "21:9": 21 / 9,
    "2.39:1": 2.39 / 1,
    "1:1": 1 / 1,
  };

  // Architect scale conversion (inches per foot on drawing)
  // For Imperial: value = inches per foot (e.g., 1/4 means 1/4 inch = 1 foot)
  // For Engineering: 1"=X' means 1 inch = X feet, so value = 1/X
  // For Metric: 1:X means 1 unit = X units, we convert to equivalent feet-per-inch
  const architectScales: { [key: string]: number } = {
    // Imperial Architect scales (fraction of inch = 1 foot)
    "1/32": 1 / 32,
    "1/16": 1 / 16,
    "1/8": 1 / 8,
    "3/16": 3 / 16,
    "1/4": 1 / 4,
    "3/8": 3 / 8,
    "1/2": 1 / 2,
    "3/4": 3 / 4,
    "1": 1,
    "1-1/2": 1.5,
    "2": 2,
    "3": 3,
    // Imperial Engineering scales (1" = X feet)
    "1=10": 1 / 10,
    "1=20": 1 / 20,
    "1=30": 1 / 30,
    "1=40": 1 / 40,
    "1=50": 1 / 50,
    "1=100": 1 / 100,
    // Metric scales (1:X ratio) - converted to equivalent "inches per foot"
    // 1:1 = full size, 1:50 means 1mm = 50mm real, etc.
    // For display we use the ratio directly; calculation: 1/(ratio * 12/304.8) for metric->imperial conversion
    // Simplified: we treat these as direct ratios where feetPerInch = ratio / 12
    "1:1": 12,
    "1:2": 6,
    "1:4": 3,
    "1:5": 2.4,
    "1:8": 1.5,
    "1:10": 1.2,
    "1:20": 0.6,
    "1:25": 0.48,
    "1:50": 0.24,
    "1:100": 0.12,
    "1:200": 0.06,
    "1:500": 0.024,
    "1:1000": 0.012,
    "1:5000": 0.0024,
    "1:10000": 0.0012,
  };

  // ============================================
  // CAD TAB STATE
  // ============================================
  const [cadPdfFile, setCadPdfFile] = useState<File | null>(null);
  const [cadPdfData, setCadPdfData] = useState<string | null>(null); // Base64-encoded PDF for persistence
  const [cadPdfDocument, setCadPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [cadCurrentPage, setCadCurrentPage] = useState<number>(1);
  const [cadTotalPages, setCadTotalPages] = useState<number>(1);
  const [cadZoom, setCadZoom] = useState<number>(1);
  const [cadPinchStartDist, setCadPinchStartDist] = useState<number | null>(null);
  const [cadPinchStartZoom, setCadPinchStartZoom] = useState<number>(1);
  const [cadScale, setCadScale] = useState<string>("1/4"); // Architect scale
  const [cadCustomScale, setCadCustomScale] = useState<string>("1"); // 1 inch = X feet
  const [cadScaleMode, setCadScaleMode] = useState<"architect" | "custom">("architect");

  // Multi-projector support - each projector has its own settings AND screen
  interface CadProjector {
    id: number;
    planPos: { x: number; y: number };
    sectionPos: { x: number; y: number };
    screenPlanPos: { x: number; y: number };
    screenSectionPos: { x: number; y: number };
    throwRatio: number;
    throwRatioMin: number; // minimum throw ratio (for zoom lenses)
    throwRatioMax: number; // maximum throw ratio (for zoom lenses)
    lensType: "fixed" | "zoom"; // lens type
    lensShiftH: number; // horizontal lens shift for plan view
    lensShiftV: number; // vertical lens shift for section view
    lumens: string;
    brand: string;
    model: string;
    screenYaw: number;
    aspectRatio: "16:9" | "16:10" | "4:3"; // per-projector aspect ratio
  }

  // Projector colors: 1=red, 2=green, 3=purple, 4=dark yellow, 5=orange, etc.
  const projectorColors = [
    { fill: "#ef4444", stroke: "#b91c1c", name: "red" },       // 1 - red
    { fill: "#22c55e", stroke: "#15803d", name: "green" },     // 2 - green  
    { fill: "#a855f7", stroke: "#7e22ce", name: "purple" },    // 3 - purple
    { fill: "#ca8a04", stroke: "#a16207", name: "yellow" },    // 4 - dark yellow
    { fill: "#f97316", stroke: "#c2410c", name: "orange" },    // 5 - orange
    { fill: "#06b6d4", stroke: "#0891b2", name: "cyan" },      // 6 - cyan
    { fill: "#ec4899", stroke: "#be185d", name: "pink" },      // 7 - pink
    { fill: "#8b5cf6", stroke: "#6d28d9", name: "violet" },    // 8 - violet
  ];

  const createDefaultProjector = (id: number): CadProjector => ({
    id,
    planPos: { x: 200 + (id - 1) * 50, y: 200 },
    sectionPos: { x: 200 + (id - 1) * 50, y: 300 },
    screenPlanPos: { x: 400 + (id - 1) * 50, y: 200 },
    screenSectionPos: { x: 400 + (id - 1) * 50, y: 200 },
    throwRatio: 1.5,
    throwRatioMin: 0.3,
    throwRatioMax: 5.0,
    lensType: "zoom",
    lensShiftH: 0,
    lensShiftV: 0,
    lumens: "12000",
    brand: "",
    model: "",
    screenYaw: 0,
    aspectRatio: "16:9",
  });

  const [cadProjectors, setCadProjectors] = useState<CadProjector[]>([createDefaultProjector(1)]);
  const [cadSelectedProjector, setCadSelectedProjector] = useState<number>(1); // ID of selected projector
  const [cadScreenWidth, setCadScreenWidth] = useState<number>(16); // feet

  // Lock mode (shared)
  const [cadLockMode, setCadLockMode] = useState<"screen" | "projector">("screen");

  // Dragging state for CAD - now tracks which projector ID is being dragged
  const [cadDragging, setCadDragging] = useState<{ type: "projector" | "screen" | "lineStart" | "lineEnd" | "floorZ"; projectorId?: number } | null>(null);
  const [cadPanOffset, setCadPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cadRotation, setCadRotation] = useState<number>(0); // Rotation in degrees (0, 90, 180, 270)
  const [cadPanMode, setCadPanMode] = useState<boolean>(false); // Pan mode toggle
  const [cadLineMode, setCadLineMode] = useState<boolean>(false); // Line measurement mode
  const [cadLineMeasurement, setCadLineMeasurement] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } }>({
    start: { x: 150, y: 150 },
    end: { x: 350, y: 150 }
  }); // Measurement line endpoints
  const [cadIsPanning, setCadIsPanning] = useState<boolean>(false); // Currently panning
  const [cadPanStart, setCadPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // Pan start position
  const [cadMinZoom, setCadMinZoom] = useState<number>(0.25); // Minimum zoom to fit container
  const [cadPdfSize, setCadPdfSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 }); // PDF canvas size
  const [cadUnit, setCadUnit] = useState<"inches" | "cm" | "feet" | "meters">("feet"); // CAD units

  // View mode: plan (top-down) or section (side view)
  const [cadViewMode, setCadViewMode] = useState<"plan" | "section">("plan");
  const [cadAspectRatio, setCadAspectRatio] = useState<"16:9" | "16:10" | "4:3">("16:9");
  const [cadFullscreen, setCadFullscreen] = useState<boolean>(false); // Fullscreen mode
  const [cadFloorZ, setCadFloorZ] = useState<{ x: number; y: number } | null>(null); // Floor Z reference position in PDF coords
  const [cadFloorZVisible, setCadFloorZVisible] = useState<boolean>(false); // Whether to show the Floor Z handle

  // Helper to get selected projector
  const getSelectedProjector = () => cadProjectors.find(p => p.id === cadSelectedProjector) || cadProjectors[0];

  // Helper to update selected projector
  const updateSelectedProjector = (updates: Partial<CadProjector>) => {
    setCadProjectors(prev => prev.map(p =>
      p.id === cadSelectedProjector ? { ...p, ...updates } : p
    ));
  };

  // Add new projector
  const addProjector = () => {
    const newId = Math.max(...cadProjectors.map(p => p.id)) + 1;
    setCadProjectors(prev => [...prev, createDefaultProjector(newId)]);
    setCadSelectedProjector(newId);
  };

  // Remove projector (must have at least one)
  const removeProjector = (id: number) => {
    if (cadProjectors.length <= 1) return;
    setCadProjectors(prev => prev.filter(p => p.id !== id));
    if (cadSelectedProjector === id) {
      setCadSelectedProjector(cadProjectors.find(p => p.id !== id)?.id || 1);
    }
  };

  // Backward compatible accessors for selected projector
  const cadProjectorPos = cadViewMode === "plan"
    ? getSelectedProjector()?.planPos || { x: 200, y: 200 }
    : getSelectedProjector()?.sectionPos || { x: 200, y: 300 };
  const cadSectionProjectorPos = getSelectedProjector()?.sectionPos || { x: 200, y: 300 };
  const cadScreenPos = cadViewMode === "plan"
    ? getSelectedProjector()?.screenPlanPos || { x: 400, y: 200 }
    : getSelectedProjector()?.screenSectionPos || { x: 400, y: 200 };
  const cadSectionScreenPos = getSelectedProjector()?.screenSectionPos || { x: 400, y: 200 };
  const cadThrowRatio = getSelectedProjector()?.throwRatio || 1.5;
  const cadLensShift = getSelectedProjector()?.lensShiftH || 0;
  const cadVerticalLensShift = getSelectedProjector()?.lensShiftV || 0;
  const cadLumens = getSelectedProjector()?.lumens || "12000";
  const cadScreenYaw = getSelectedProjector()?.screenYaw || 0;

  // Backward compatible setters
  const setCadProjectorPos = (pos: { x: number; y: number }) => {
    if (cadViewMode === "plan") {
      updateSelectedProjector({ planPos: pos });
    } else {
      updateSelectedProjector({ sectionPos: pos });
    }
  };
  const setCadSectionProjectorPos = (pos: { x: number; y: number }) => updateSelectedProjector({ sectionPos: pos });
  const setCadScreenPos = (pos: { x: number; y: number }) => {
    if (cadViewMode === "plan") {
      updateSelectedProjector({ screenPlanPos: pos });
    } else {
      updateSelectedProjector({ screenSectionPos: pos });
    }
  };
  const setCadSectionScreenPos = (pos: { x: number; y: number }) => updateSelectedProjector({ screenSectionPos: pos });
  const setCadThrowRatio = (val: number) => updateSelectedProjector({ throwRatio: val });
  const setCadLensShift = (val: number) => updateSelectedProjector({ lensShiftH: val });
  const setCadVerticalLensShift = (val: number) => updateSelectedProjector({ lensShiftV: val });
  const setCadLumens = (val: string) => updateSelectedProjector({ lumens: val });
  const setCadScreenYaw = (val: number) => updateSelectedProjector({ screenYaw: val });
  const cadProjectorAspectRatio = getSelectedProjector()?.aspectRatio || "16:9";
  const setCadProjectorAspectRatio = (val: "16:9" | "16:10" | "4:3") => updateSelectedProjector({ aspectRatio: val });
  const cadProjectorBrand = getSelectedProjector()?.brand || "";
  const cadProjectorModel = getSelectedProjector()?.model || "";
  const setCadProjectorBrand = (val: string) => updateSelectedProjector({ brand: val });
  const setCadProjectorModel = (val: string) => updateSelectedProjector({ model: val });
  const cadProjectorThrowRatioMin = getSelectedProjector()?.throwRatioMin || 0.3;
  const cadProjectorThrowRatioMax = getSelectedProjector()?.throwRatioMax || 5.0;
  const cadProjectorLensType = getSelectedProjector()?.lensType || "zoom";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const differenceCanvasRef = useRef<HTMLCanvasElement>(null);
  const projectorCanvasRef = useRef<HTMLCanvasElement>(null);
  const estimatorCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CAD tab refs
  const cadCanvasRef = useRef<HTMLCanvasElement>(null);
  const cadOverlayRef = useRef<HTMLCanvasElement>(null);
  const cadPdfInputRef = useRef<HTMLInputElement>(null);
  const cadContainerRef = useRef<HTMLDivElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // PROJECT MANAGEMENT FUNCTIONS
  // ============================================

  // Get current settings as an object
  const getCurrentSettings = useCallback((): ProjectSettings => ({
    measurementWidth,
    measurementHeight,
    widthFeet,
    widthInches,
    heightFeet,
    heightInches,
    pixelWidth,
    pixelHeight,
    unit,
    lumens,
    screenGain,
    testPatternName,
    patternMode,
    throwRatio,
    zoomEnabled,
    throwRatioMin,
    throwRatioMax,
    projectorOrientation,
    projectorAspectRatio,
    projectorNativeWidth,
    projectorNativeHeight,
    diagramView,
    projectorMode,
    projectorCount,
    blendOverlap,
    blendScaleMode,
    projectTitle,
    projectNotes,
    clientName,
    cadScale,
    cadCustomScale,
    cadScaleMode,
    cadProjectors,
    cadSelectedProjector,
    cadScreenWidth,
    cadLockMode,
    cadViewMode,
    cadUnit,
    cadCurrentPage,
    cadZoom,
    cadPanOffset,
    cadRotation,
  }), [measurementWidth, measurementHeight, widthFeet, widthInches, heightFeet, heightInches,
    pixelWidth, pixelHeight, unit, lumens, screenGain, testPatternName, patternMode,
    throwRatio, zoomEnabled, throwRatioMin, throwRatioMax, projectorOrientation,
    projectorAspectRatio, projectorNativeWidth, projectorNativeHeight, diagramView,
    projectorMode, projectorCount, blendOverlap, blendScaleMode, projectTitle, projectNotes,
    clientName, cadScale, cadCustomScale, cadScaleMode, cadProjectors, cadSelectedProjector,
    cadScreenWidth, cadLockMode, cadViewMode, cadUnit, cadCurrentPage, cadZoom, cadPanOffset, cadRotation]);

  // Apply settings from a saved project
  const applySettings = useCallback((settings: ProjectSettings) => {
    setMeasurementWidth(settings.measurementWidth);
    setMeasurementHeight(settings.measurementHeight);
    setWidthFeet(settings.widthFeet);
    setWidthInches(settings.widthInches);
    setHeightFeet(settings.heightFeet);
    setHeightInches(settings.heightInches);
    setPixelWidth(settings.pixelWidth);
    setPixelHeight(settings.pixelHeight);
    setUnit(settings.unit);
    setLumens(settings.lumens);
    setScreenGain(settings.screenGain);
    setTestPatternName(settings.testPatternName);
    setPatternMode(settings.patternMode);
    setThrowRatio(settings.throwRatio);
    setZoomEnabled(settings.zoomEnabled);
    setThrowRatioMin(settings.throwRatioMin);
    setThrowRatioMax(settings.throwRatioMax);
    setProjectorOrientation(settings.projectorOrientation);
    setProjectorAspectRatio(settings.projectorAspectRatio);
    setProjectorNativeWidth(settings.projectorNativeWidth);
    setProjectorNativeHeight(settings.projectorNativeHeight);
    setDiagramView(settings.diagramView);
    setProjectorMode(settings.projectorMode);
    setProjectorCount(settings.projectorCount);
    setBlendOverlap(settings.blendOverlap);
    setBlendScaleMode(settings.blendScaleMode);
    setProjectTitle(settings.projectTitle);
    setProjectNotes(settings.projectNotes);
    setClientName(settings.clientName);
    setCadScale(settings.cadScale);
    setCadCustomScale(settings.cadCustomScale);
    setCadScaleMode(settings.cadScaleMode);
    setCadProjectors(settings.cadProjectors);
    setCadSelectedProjector(settings.cadSelectedProjector);
    setCadScreenWidth(settings.cadScreenWidth);
    setCadLockMode(settings.cadLockMode);
    setCadViewMode(settings.cadViewMode);
    setCadUnit(settings.cadUnit);
    setCadCurrentPage(settings.cadCurrentPage);
    setCadZoom(settings.cadZoom);
    setCadPanOffset(settings.cadPanOffset);
    setCadRotation(settings.cadRotation);
  }, []);

  // Load saved projects from localStorage
  const loadSavedProjects = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedProjects(JSON.parse(stored));
      }
      const currentId = localStorage.getItem(CURRENT_PROJECT_KEY);
      if (currentId && stored) {
        const projects = JSON.parse(stored) as SavedProject[];
        const current = projects.find(p => p.id === currentId);
        if (current) {
          setCurrentProjectId(current.id);
          setCurrentProjectName(current.name);
          applySettings(current.settings);
        }
      }
    } catch (e) {
      console.error("Error loading saved projects:", e);
    }
  }, [applySettings]);

  // Save current project
  const saveProject = useCallback(() => {
    const settings = getCurrentSettings();
    const now = new Date().toISOString();

    let projectId = currentProjectId;
    if (!projectId) {
      projectId = `proj_${Date.now()}`;
      setCurrentProjectId(projectId);
    }

    const project: SavedProject = {
      id: projectId,
      name: currentProjectName,
      lastModified: now,
      pdfFileName: cadPdfFile?.name,
      pdfData: cadPdfData || undefined, // Include base64 PDF data
      settings,
    };

    setSavedProjects(prev => {
      const existing = prev.findIndex((p: SavedProject) => p.id === projectId);
      let updated: SavedProject[];
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = project;
      } else {
        updated = [...prev, project];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
    setLastSaved(new Date());
  }, [getCurrentSettings, currentProjectId, currentProjectName, cadPdfFile?.name, cadPdfData]);

  // Create new project
  const newProject = useCallback(() => {
    const newId = `proj_${Date.now()}`;
    setCurrentProjectId(newId);
    setCurrentProjectName("Untitled Project");
    // Reset all settings to defaults
    setMeasurementWidth("16");
    setMeasurementHeight("9");
    setWidthFeet("16");
    setWidthInches("0");
    setHeightFeet("9");
    setHeightInches("0");
    setPixelWidth("1920");
    setPixelHeight("");
    setUnit("feet");
    setLumens("12000");
    setScreenGain("1");
    setTestPatternName("Test Pattern");
    setPatternMode("light");
    setThrowRatio("1.5");
    setZoomEnabled(true);
    setThrowRatioMin("1.2");
    setThrowRatioMax("1.8");
    setProjectorOrientation("landscape");
    setProjectorAspectRatio("16:9");
    setProjectorNativeWidth("1920");
    setProjectorNativeHeight("1080");
    setDiagramView("plan");
    setProjectorMode("single");
    setProjectorCount(2);
    setBlendOverlap(20);
    setBlendScaleMode("width");
    setProjectTitle("");
    setProjectNotes("");
    setClientName("");
    setCadScale("1/4");
    setCadCustomScale("1");
    setCadScaleMode("architect");
    setCadProjectors([createDefaultProjector(1)]);
    setCadSelectedProjector(1);
    setCadScreenWidth(16);
    setCadLockMode("screen");
    setCadViewMode("plan");
    setCadUnit("feet");
    setCadCurrentPage(1);
    setCadZoom(1);
    setCadPanOffset({ x: 0, y: 0 });
    setCadRotation(0);
    setCadPdfDocument(null);
    setCadPdfFile(null);
    setCadPdfData(null);
    localStorage.setItem(CURRENT_PROJECT_KEY, newId);
  }, []);

  // Open a saved project
  const openProject = useCallback(async (project: SavedProject) => {
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    applySettings(project.settings);
    localStorage.setItem(CURRENT_PROJECT_KEY, project.id);
    setProjectMenuOpen(false);

    // Restore PDF from base64 data if available
    if (project.pdfData) {
      try {
        // Convert base64 to ArrayBuffer
        const binaryString = atob(project.pdfData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;

        // Load PDF document
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setCadPdfDocument(pdf);
        setCadTotalPages(pdf.numPages);
        setCadCurrentPage(1);
        setCadPdfData(project.pdfData);

        // Create a File object for display purposes
        if (project.pdfFileName) {
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const file = new File([blob], project.pdfFileName, { type: 'application/pdf' });
          setCadPdfFile(file);
        }
      } catch (err) {
        console.error("Error restoring PDF:", err);
        alert(`Could not restore PDF: "${project.pdfFileName}". Please re-upload it in the CAD tab.`);
      }
    } else if (project.pdfFileName) {
      // Legacy: PDF filename exists but no data (older saved projects)
      alert(`This project used a PDF file: "${project.pdfFileName}". Please re-upload it in the CAD tab.`);
    } else {
      // Clear any existing PDF when switching to a project without PDF
      setCadPdfDocument(null);
      setCadPdfFile(null);
      setCadPdfData(null);
    }
  }, [applySettings]);

  // Delete a project
  const deleteProject = useCallback((projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setSavedProjects(prev => {
      const updated = prev.filter(p => p.id !== projectId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    if (currentProjectId === projectId) {
      newProject();
    }
  }, [currentProjectId, newProject]);

  // Export project as JSON file
  const exportProject = useCallback(() => {
    const settings = getCurrentSettings();
    const project: SavedProject = {
      id: currentProjectId || `proj_${Date.now()}`,
      name: currentProjectName,
      lastModified: new Date().toISOString(),
      pdfFileName: cadPdfFile?.name,
      settings,
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProjectName.replace(/[^a-z0-9]/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getCurrentSettings, currentProjectId, currentProjectName, cadPdfFile?.name]);

  // Import project from JSON file
  const importProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target?.result as string) as SavedProject;
        // Generate new ID to avoid conflicts
        project.id = `proj_${Date.now()}`;
        project.lastModified = new Date().toISOString();

        setSavedProjects(prev => {
          const updated = [...prev, project];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });

        openProject(project);
      } catch (err) {
        alert("Error importing project file. Please check the file format.");
      }
    };
    reader.readAsText(file);
  }, [openProject]);

  // Rename current project
  const renameProject = useCallback(() => {
    if (renameValue.trim()) {
      setCurrentProjectName(renameValue.trim());
      setShowRenameModal(false);
      // Update in saved projects if it exists
      if (currentProjectId) {
        setSavedProjects(prev => {
          const updated = prev.map(p =>
            p.id === currentProjectId ? { ...p, name: renameValue.trim() } : p
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [renameValue, currentProjectId]);

  // Load saved projects on mount
  useEffect(() => {
    loadSavedProjects();
  }, [loadSavedProjects]);

  // Auto-save every 30 seconds if enabled
  useEffect(() => {
    if (!autoSaveEnabled) return;
    const interval = setInterval(() => {
      saveProject();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSaveEnabled, saveProject]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setProjectMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Persist dark mode preference and dispatch event for App.tsx
  useEffect(() => {
    localStorage.setItem("projector-calc-dark-mode", JSON.stringify(darkMode));
    window.dispatchEvent(new CustomEvent('darkModeChange', { detail: darkMode }));
  }, [darkMode]);

  // ============================================
  // PROJECTOR INVENTORY FUNCTIONS
  // ============================================

  // Load inventory from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(INVENTORY_KEY);
      if (stored) {
        setProjectorInventory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading projector inventory:", e);
    }
  }, []);

  // Save inventory to localStorage
  const saveInventory = useCallback((inventory: InventoryProjector[]) => {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  }, []);

  // Add or update projector in inventory
  const saveProjectorToInventory = useCallback((projector: InventoryProjector) => {
    setProjectorInventory(prev => {
      const existing = prev.findIndex(p => p.id === projector.id);
      let updated: InventoryProjector[];
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = projector;
      } else {
        updated = [...prev, projector];
      }
      saveInventory(updated);
      return updated;
    });
    setEditingProjector(null);
  }, [saveInventory]);

  // Delete projector from inventory
  const deleteProjectorFromInventory = useCallback((id: string) => {
    if (!confirm("Delete this projector from inventory?")) return;
    setProjectorInventory(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveInventory(updated);
      return updated;
    });
    if (selectedInventoryProjector === id) {
      setSelectedInventoryProjector("custom");
    }
  }, [saveInventory, selectedInventoryProjector]);

  // Create new projector for editing
  const createNewProjector = useCallback((): InventoryProjector => ({
    id: `proj_${Date.now()}`,
    brand: "",
    model: "",
    nativeWidth: "1920",
    nativeHeight: "1080",
    lensType: "zoom",
    throwRatioMin: "1.2",
    throwRatioMax: "1.8",
    lumens: "12000",
  }), []);

  // Apply selected projector settings to Throw Distance tab
  const applyInventoryProjector = useCallback((projectorId: string) => {
    setSelectedInventoryProjector(projectorId);
    if (projectorId === "custom") return;

    const projector = projectorInventory.find(p => p.id === projectorId);
    if (!projector) return;

    // Apply settings
    setProjectorNativeWidth(projector.nativeWidth);
    setProjectorNativeHeight(projector.nativeHeight);
    setLumens(projector.lumens);

    if (projector.lensType === "fixed") {
      setZoomEnabled(false);
      setThrowRatio(projector.throwRatioMin);
    } else {
      setZoomEnabled(true);
      setThrowRatioMin(projector.throwRatioMin);
      setThrowRatioMax(projector.throwRatioMax);
      // Set current throw ratio to middle of zoom range
      const mid = (parseFloat(projector.throwRatioMin) + parseFloat(projector.throwRatioMax)) / 2;
      setThrowRatio(mid.toFixed(2));
    }
  }, [projectorInventory]);

  // Apply inventory projector to selected CAD projector
  const applyInventoryToCadProjector = useCallback((inventoryProjectorId: string) => {
    if (inventoryProjectorId === "custom") {
      // Reset to full range when switching to custom
      updateSelectedProjector({
        brand: "",
        model: "",
        throwRatioMin: 0.3,
        throwRatioMax: 5.0,
        lensType: "zoom" as const,
      });
      return;
    }

    const invProj = projectorInventory.find(p => p.id === inventoryProjectorId);
    if (!invProj) return;

    // Apply settings to the selected CAD projector
    const throwRatioMin = parseFloat(invProj.throwRatioMin);
    const throwRatioMax = parseFloat(invProj.throwRatioMax);
    const throwRatio = invProj.lensType === "fixed"
      ? throwRatioMin
      : (throwRatioMin + throwRatioMax) / 2;

    updateSelectedProjector({
      brand: invProj.brand,
      model: invProj.model,
      throwRatio: throwRatio,
      throwRatioMin: throwRatioMin,
      throwRatioMax: throwRatioMax,
      lensType: invProj.lensType as "fixed" | "zoom",
      lumens: invProj.lumens,
    });
  }, [projectorInventory, updateSelectedProjector]);

  // Draw projector, screen, and beam overlay for all projectors
  const drawCadOverlay = useCallback(() => {
    const overlay = cadOverlayRef.current;
    const pdfCanvas = cadCanvasRef.current;
    if (!overlay || !pdfCanvas) return;

    overlay.width = pdfCanvas.width;
    overlay.height = pdfCanvas.height;

    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Aspect ratio lookup
    const aspectRatios: Record<string, { width: number; height: number }> = {
      "16:9": { width: 16, height: 9 },
      "16:10": { width: 16, height: 10 },
      "4:3": { width: 4, height: 3 },
    };

    // Draw each projector's beam, screen, and icon
    cadProjectors.forEach((projector, index) => {
      const color = projectorColors[index % projectorColors.length];
      const isSelected = projector.id === cadSelectedProjector;

      // Use per-projector aspect ratio
      const aspect = aspectRatios[projector.aspectRatio] || aspectRatios["16:9"];

      // Get projector and screen positions based on view mode
      const projX = cadViewMode === "plan" ? projector.planPos.x : projector.sectionPos.x;
      const projY = cadViewMode === "plan" ? projector.planPos.y : projector.sectionPos.y;
      const screenX = cadViewMode === "plan" ? projector.screenPlanPos.x : projector.screenSectionPos.x;
      const screenY = cadViewMode === "plan" ? projector.screenPlanPos.y : projector.screenSectionPos.y;

      // Calculate beam geometry
      const dx = screenX - projX;
      const dy = screenY - projY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Screen dimensions based on throw ratio
      const screenWidthPx = distance / projector.throwRatio;
      const screenHeightPx = screenWidthPx * aspect.height / aspect.width;

      // Beam spread based on view mode
      const beamSpread = cadViewMode === "plan" ? screenWidthPx : screenHeightPx;
      const lensShift = cadViewMode === "plan" ? projector.lensShiftH : projector.lensShiftV;
      const lensShiftOffset = (lensShift / 100) * beamSpread * 0.5;

      // Yaw from projector's own setting
      const yawRadians = (projector.screenYaw * Math.PI) / 180;

      // Draw projection beam
      ctx.save();
      ctx.translate(projX, projY);
      ctx.rotate(angle);

      const screenEdge1 = -beamSpread / 2 + lensShiftOffset;
      const screenEdge2 = beamSpread / 2 + lensShiftOffset;
      const yawOffset1 = screenEdge1 * Math.tan(yawRadians);
      const yawOffset2 = screenEdge2 * Math.tan(yawRadians);

      // Beam trapezoid with projector's color
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(distance + yawOffset1, screenEdge1);
      ctx.lineTo(distance + yawOffset2, screenEdge2);
      ctx.closePath();
      ctx.fillStyle = color.fill + "26"; // 15% opacity
      ctx.fill();
      ctx.strokeStyle = color.fill + "80"; // 50% opacity
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Center line (dashed)
      ctx.beginPath();
      ctx.setLineDash([8, 4]);
      ctx.moveTo(0, 0);
      ctx.lineTo(distance, 0);
      ctx.strokeStyle = color.fill + "cc"; // 80% opacity
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      // Draw screen handle with projector's color (lighter shade)
      ctx.beginPath();
      ctx.arc(screenX, screenY, isSelected ? 32 : 28, 0, Math.PI * 2);
      ctx.fillStyle = color.fill + "40"; // Lighter fill
      ctx.fill();
      ctx.strokeStyle = color.fill;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Screen number inside bubble (counter-rotate to stay upright)
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate((-cadRotation * Math.PI) / 180);
      ctx.font = "900 36px sans-serif";
      ctx.fillStyle = color.stroke;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${projector.id}`, 0, 0);
      ctx.restore();

      // Draw projector icon with its color
      ctx.beginPath();
      ctx.arc(projX, projY, isSelected ? 36 : 32, 0, Math.PI * 2);
      ctx.fillStyle = color.fill;
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#ffffff" : color.stroke;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Projector number inside bubble (counter-rotate to stay upright)
      ctx.save();
      ctx.translate(projX, projY);
      ctx.rotate((-cadRotation * Math.PI) / 180);
      ctx.font = "900 40px sans-serif";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${projector.id}`, 0, 0);
      ctx.restore();
    });

    // Draw measurement line if line mode is enabled
    if (cadLineMode) {
      const { start, end } = cadLineMeasurement;
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;

      // Calculate distance
      const lineDx = end.x - start.x;
      const lineDy = end.y - start.y;
      const distPx = Math.sqrt(lineDx * lineDx + lineDy * lineDy);

      // Convert to real units
      const feetPerInch = cadScaleMode === "architect"
        ? 1 / (architectScales[cadScale] || 0.25)
        : parseFloat(cadCustomScale) || 1;
      const distFeet = (distPx / 108) * feetPerInch;

      // Format distance based on unit
      let distText = "";
      switch (cadUnit) {
        case "feet":
          distText = `${distFeet.toFixed(2)} ft`;
          break;
        case "inches":
          distText = `${(distFeet * 12).toFixed(1)} in`;
          break;
        case "meters":
          distText = `${(distFeet * 0.3048).toFixed(2)} m`;
          break;
        case "cm":
          distText = `${(distFeet * 30.48).toFixed(1)} cm`;
          break;
      }

      // Draw the line
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = "#f59e0b"; // Amber color
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw start handle
      ctx.beginPath();
      ctx.arc(start.x, start.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245, 158, 11, 0.3)"; // 30% opacity amber
      ctx.fill();
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Draw + marker on start handle
      ctx.beginPath();
      ctx.moveTo(start.x - 8, start.y);
      ctx.lineTo(start.x + 8, start.y);
      ctx.moveTo(start.x, start.y - 8);
      ctx.lineTo(start.x, start.y + 8);
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw end handle
      ctx.beginPath();
      ctx.arc(end.x, end.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245, 158, 11, 0.3)"; // 30% opacity amber
      ctx.fill();
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Draw + marker on end handle
      ctx.beginPath();
      ctx.moveTo(end.x - 8, end.y);
      ctx.lineTo(end.x + 8, end.y);
      ctx.moveTo(end.x, end.y - 8);
      ctx.lineTo(end.x, end.y + 8);
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw distance label at midpoint
      ctx.font = "bold 28px sans-serif";
      const textMetrics = ctx.measureText(distText);
      const textWidth = textMetrics.width;
      const textHeight = 36;
      const padding = 10;

      // Background for text
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fillRect(midX - textWidth / 2 - padding, midY - textHeight / 2 - padding, textWidth + padding * 2, textHeight + padding);

      // Text
      ctx.fillStyle = "#1e40af";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(distText, midX, midY);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    // Draw Floor Z marker (only in section mode when visible)
    if (cadViewMode === "section" && cadFloorZ && cadFloorZVisible) {
      // Draw purple handle with 20% opacity fill
      ctx.beginPath();
      ctx.arc(cadFloorZ.x, cadFloorZ.y, 36, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(147, 51, 234, 0.2)"; // 20% opacity purple
      ctx.fill();
      ctx.strokeStyle = "#9333ea";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw + marker
      ctx.beginPath();
      ctx.moveTo(cadFloorZ.x - 24, cadFloorZ.y);
      ctx.lineTo(cadFloorZ.x + 24, cadFloorZ.y);
      ctx.moveTo(cadFloorZ.x, cadFloorZ.y - 24);
      ctx.lineTo(cadFloorZ.x, cadFloorZ.y + 24);
      ctx.strokeStyle = "#9333ea";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw "Floor Z" label - above the handle with spacing, counter-rotated
      ctx.save();
      ctx.translate(cadFloorZ.x, cadFloorZ.y - 70);
      ctx.rotate(-cadRotation * Math.PI / 180); // Counter-rotate
      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = "#9333ea";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Floor Z", 0, 0);
      ctx.restore();
    }
  }, [cadProjectors, cadSelectedProjector, cadViewMode, projectorColors, cadLineMode, cadLineMeasurement, cadScaleMode, cadScale, cadCustomScale, cadUnit, cadRotation, cadFloorZ, cadFloorZVisible]);

  // Redraw overlay when positions change
  useEffect(() => {
    if (cadPdfDocument) {
      drawCadOverlay();
    }
  }, [cadPdfDocument, cadProjectors, cadSelectedProjector, cadScreenPos, cadSectionScreenPos, cadScreenYaw, cadViewMode, cadAspectRatio, drawCadOverlay]);

  // Container dimensions for CAD canvas
  const CAD_CONTAINER_WIDTH = 600;
  const CAD_CONTAINER_HEIGHT = 400;

  // Constrain pan offset to keep PDF filling the container
  const constrainPanOffset = useCallback((newOffset: { x: number; y: number }, zoom: number): { x: number; y: number } => {
    if (cadPdfSize.width === 0 || cadPdfSize.height === 0) return newOffset;

    const container = cadContainerRef.current;
    const containerWidth = container?.clientWidth || CAD_CONTAINER_WIDTH;
    const containerHeight = container?.clientHeight || CAD_CONTAINER_HEIGHT;

    // Account for rotation - swap dimensions when rotated 90 or 270 degrees
    const isRotated = cadRotation === 90 || cadRotation === 270;
    const effectiveWidth = isRotated ? cadPdfSize.height : cadPdfSize.width;
    const effectiveHeight = isRotated ? cadPdfSize.width : cadPdfSize.height;

    const scaledWidth = effectiveWidth * zoom;
    const scaledHeight = effectiveHeight * zoom;

    const maxPanX = Math.max(0, (scaledWidth - containerWidth) / 2 / zoom);
    const maxPanY = Math.max(0, (scaledHeight - containerHeight) / 2 / zoom);

    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, newOffset.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newOffset.y)),
    };
  }, [cadPdfSize, cadRotation]);

  // Transform screen coordinates to canvas coordinates, accounting for rotation
  const screenToCanvasCoords = useCallback((screenX: number, screenY: number, rect: DOMRect): { x: number; y: number } => {
    // Get position relative to center of bounding rect
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const relX = (screenX - rect.left - centerX) / cadZoom;
    const relY = (screenY - rect.top - centerY) / cadZoom;

    // Unrotate the coordinates
    const radians = (-cadRotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const unrotatedX = relX * cos - relY * sin;
    const unrotatedY = relX * sin + relY * cos;

    // Add back the canvas center offset
    const canvasWidth = cadPdfSize.width;
    const canvasHeight = cadPdfSize.height;
    return {
      x: unrotatedX + canvasWidth / 2,
      y: unrotatedY + canvasHeight / 2,
    };
  }, [cadZoom, cadRotation, cadPdfSize]);

  // Clamp position to keep handles within canvas bounds (with margin for grabbing)
  const clampToCanvasBounds = useCallback((x: number, y: number): { x: number; y: number } => {
    const margin = 30; // Keep handles at least 30px from edge
    return {
      x: Math.max(margin, Math.min(cadPdfSize.width - margin, x)),
      y: Math.max(margin, Math.min(cadPdfSize.height - margin, y)),
    };
  }, [cadPdfSize]);

  // Recalculate min zoom when rotation changes
  useEffect(() => {
    if (cadPdfSize.width === 0 || cadPdfSize.height === 0) return;

    const container = cadContainerRef.current;
    const containerWidth = container?.clientWidth || CAD_CONTAINER_WIDTH;
    const containerHeight = container?.clientHeight || CAD_CONTAINER_HEIGHT;

    const isRotated = cadRotation === 90 || cadRotation === 270;
    const effectivePdfWidth = isRotated ? cadPdfSize.height : cadPdfSize.width;
    const effectivePdfHeight = isRotated ? cadPdfSize.width : cadPdfSize.height;

    const fitZoomX = containerWidth / effectivePdfWidth;
    const fitZoomY = containerHeight / effectivePdfHeight;
    const fitZoom = Math.min(fitZoomX, fitZoomY);

    setCadMinZoom(fitZoom);
    if (cadZoom < fitZoom) {
      setCadZoom(fitZoom);
    }
    setCadPanOffset({ x: 0, y: 0 });
  }, [cadRotation, cadPdfSize]);

  // Render PDF to canvas when document loads or page changes
  useEffect(() => {
    const renderPdf = async () => {
      if (!cadPdfDocument) return;

      // Wait longer for fullscreen transitions to complete
      await new Promise(resolve => setTimeout(resolve, cadFullscreen ? 200 : 100));

      const canvas = cadCanvasRef.current;
      const container = cadContainerRef.current;
      if (!canvas) {
        console.log("Canvas not ready, retrying in 100ms...");
        // Retry after a short delay
        setTimeout(renderPdf, 100);
        return;
      }

      try {
        const page = await cadPdfDocument.getPage(cadCurrentPage);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const viewport = page.getViewport({ scale: 1.5 });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        setCadPdfSize({ width: viewport.width, height: viewport.height });

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;

        console.log("PDF page rendered successfully, size:", viewport.width, "x", viewport.height);

        // Use window size for fullscreen, otherwise container size
        const containerWidth = cadFullscreen
          ? window.innerWidth
          : (container?.clientWidth || CAD_CONTAINER_WIDTH);
        const containerHeight = cadFullscreen
          ? window.innerHeight - 60 // subtract header height
          : (container?.clientHeight || CAD_CONTAINER_HEIGHT);

        console.log("Container size:", containerWidth, "x", containerHeight);

        const isRotated = cadRotation === 90 || cadRotation === 270;
        const effectivePdfWidth = isRotated ? viewport.height : viewport.width;
        const effectivePdfHeight = isRotated ? viewport.width : viewport.height;

        const fitZoomX = containerWidth / effectivePdfWidth;
        const fitZoomY = containerHeight / effectivePdfHeight;
        // Use Math.min to ensure full PDF is visible (contain mode)
        const fitZoom = Math.min(fitZoomX, fitZoomY);

        console.log("Fit zoom calculation:", { fitZoomX, fitZoomY, fitZoom });

        setCadMinZoom(fitZoom);
        setCadZoom(fitZoom);
        setCadPanOffset({ x: 0, y: 0 });

        setTimeout(() => {
          const overlay = cadOverlayRef.current;
          if (overlay && canvas) {
            overlay.width = canvas.width;
            overlay.height = canvas.height;
            drawCadOverlay();
          }
        }, 100);
      } catch (err) {
        console.error("Error rendering PDF page:", err);
      }
    };

    renderPdf();
  }, [cadPdfDocument, cadCurrentPage, cadFullscreen]);

  // Export page canvas refs (separate instances for displaying all views)
  const exportTestPatternRef = useRef<HTMLCanvasElement>(null);
  const exportTopViewRef = useRef<HTMLCanvasElement>(null);
  const exportSectionViewRef = useRef<HTMLCanvasElement>(null);
  const exportDifferenceRef = useRef<HTMLCanvasElement>(null);

  const calculateGCD = (a: number, b: number): number => {
    return b === 0 ? a : calculateGCD(b, a % b);
  };

  const getUnitLabel = (): string => {
    switch (unit) {
      case "feet":
        return "ft";
      case "inches":
        return "in";
      case "meters":
        return "m";
      case "cm":
        return "cm";
      default:
        return "ft";
    }
  };

  const getAspectRatio = (): string => {
    const width = parseFloat(measurementWidth);
    const height = parseFloat(measurementHeight);

    if (
      isNaN(width) ||
      isNaN(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return "N/A";
    }

    const ratio = width / height;

    // Check for common aspect ratios
    if (Math.abs(ratio - 16 / 9) < 0.01) return "16:9";
    if (Math.abs(ratio - 4 / 3) < 0.01) return "4:3";
    if (Math.abs(ratio - 21 / 9) < 0.01) return "21:9";
    if (Math.abs(ratio - 1) < 0.01) return "1:1";

    // Calculate simplified ratio
    const scaledWidth = Math.round(width * 100);
    const scaledHeight = Math.round(height * 100);
    const gcd = calculateGCD(scaledWidth, scaledHeight);
    const ratioWidth = scaledWidth / gcd;
    const ratioHeight = scaledHeight / gcd;

    return `${ratioWidth}:${ratioHeight}`;
  };

  // Calculate pixel dimensions based on blendScaleMode
  useEffect(() => {
    const width = parseFloat(measurementWidth);
    const height = parseFloat(measurementHeight);
    const pxWidth = parseInt(pixelWidth);
    const pxHeight = parseInt(pixelHeight);

    if (
      !isNaN(width) &&
      !isNaN(height) &&
      width > 0 &&
      height > 0
    ) {
      if (blendScaleMode === "width") {
        // Scale to Width: Calculate height from width
        if (pxWidth > 0) {
          const calculatedHeight = Math.round(
            (pxWidth * height) / width,
          );
          setPixelHeight(calculatedHeight.toString());
        } else if (
          pixelWidth === "" ||
          measurementWidth === "" ||
          measurementHeight === ""
        ) {
          setPixelHeight("");
        }
      } else {
        // Scale to Height: Calculate width from height
        if (pxHeight > 0) {
          const calculatedWidth = Math.round(
            (pxHeight * width) / height,
          );
          setPixelWidth(calculatedWidth.toString());
        } else if (
          pixelHeight === "" ||
          measurementWidth === "" ||
          measurementHeight === ""
        ) {
          setPixelWidth("");
        }
      }
    }
  }, [
    measurementWidth,
    measurementHeight,
    pixelWidth,
    pixelHeight,
    blendScaleMode,
  ]);

  // Sync projector native resolution to target resolution (with orientation)
  useEffect(() => {
    const nativeW = parseInt(projectorNativeWidth) || 1920;
    const nativeH = parseInt(projectorNativeHeight) || 1080;

    // pixelWidth represents the TARGET CANVAS RESOLUTION (what you design at)
    // This should always be the native resolution, NOT the blended total
    if (projectorOrientation === "landscape") {
      setPixelWidth(nativeW.toString());
    } else {
      // Portrait: projector rotated 90°, so native height becomes width
      setPixelWidth(nativeH.toString());
    }
  }, [
    projectorNativeWidth,
    projectorNativeHeight,
    projectorOrientation,
  ]);

  const getDiagonalSize = (): string => {
    const width = parseFloat(measurementWidth);
    const height = parseFloat(measurementHeight);

    if (
      !isNaN(width) &&
      !isNaN(height) &&
      width > 0 &&
      height > 0
    ) {
      const diagonal = Math.sqrt(
        width * width + height * height,
      );
      return diagonal.toFixed(2);
    }
    return "N/A";
  };

  // Get correct surface pixel height (accounts for blended mode)
  const getSurfacePixelHeight = (): string => {
    const nativeW = parseInt(projectorNativeWidth) || 1920;
    const nativeH = parseInt(projectorNativeHeight) || 1080;

    if (projectorMode === "blended" && projectorCount > 1) {
      // In blended mode, height is still the native projector height (projectors side-by-side)
      if (projectorOrientation === "landscape") {
        return nativeH.toString();
      } else {
        // Portrait: native width becomes height
        return nativeW.toString();
      }
    }
    // For all other modes, use the calculated pixelHeight
    return pixelHeight;
  };

  const getPixelsPerUnit = (): string => {
    const width = parseFloat(measurementWidth);
    const pxWidth = parseInt(pixelWidth);

    if (!isNaN(width) && width > 0 && pxWidth > 0) {
      const ppu = pxWidth / width;
      return ppu.toFixed(2);
    }
    return "N/A";
  };

  // Convert feet + inches to decimal feet
  const feetInchesToDecimal = (
    feet: string,
    inches: string,
  ): number => {
    const ft = parseFloat(feet) || 0;
    const inch = parseFloat(inches) || 0;
    return ft + inch / 12;
  };

  // Convert between units
  const convertUnit = (
    value: number,
    fromUnit: string,
    toUnit: string,
  ): number => {
    if (fromUnit === toUnit) return value;

    // Convert to feet as intermediate
    let inFeet = value;
    if (fromUnit === "inches") inFeet = value / 12;
    else if (fromUnit === "cm") inFeet = value / 30.48;
    else if (fromUnit === "meters") inFeet = value * 3.28084;

    // Convert from feet to target unit
    if (toUnit === "feet") return inFeet;
    if (toUnit === "inches") return inFeet * 12;
    if (toUnit === "cm") return inFeet * 30.48;
    if (toUnit === "meters") return inFeet / 3.28084;

    return value;
  };

  // Update measurement width when feet/inches change
  useEffect(() => {
    if (unit === "feet") {
      const decimal = feetInchesToDecimal(
        widthFeet,
        widthInches,
      );
      setMeasurementWidth(decimal.toString());
    }
  }, [widthFeet, widthInches, unit]);

  // Update measurement height when feet/inches change
  useEffect(() => {
    if (unit === "feet") {
      const decimal = feetInchesToDecimal(
        heightFeet,
        heightInches,
      );
      setMeasurementHeight(decimal.toString());
    }
  }, [heightFeet, heightInches, unit]);

  // When unit changes, convert measurements and update feet/inches if needed
  useEffect(() => {
    if (previousUnit !== unit) {
      const currentWidth = parseFloat(measurementWidth) || 0;
      const currentHeight = parseFloat(measurementHeight) || 0;

      // Convert current values from previous unit to new unit
      const newWidth = convertUnit(
        currentWidth,
        previousUnit,
        unit,
      );
      const newHeight = convertUnit(
        currentHeight,
        previousUnit,
        unit,
      );

      setMeasurementWidth(newWidth.toFixed(2));
      setMeasurementHeight(newHeight.toFixed(2));

      // If switching to feet, update feet/inches inputs
      if (unit === "feet") {
        setWidthFeet(Math.floor(newWidth).toString());
        setWidthInches(((newWidth % 1) * 12).toFixed(0));
        setHeightFeet(Math.floor(newHeight).toString());
        setHeightInches(((newHeight % 1) * 12).toFixed(0));
      }

      setPreviousUnit(unit);
    }
  }, [unit, previousUnit, measurementWidth, measurementHeight]);

  // Calculate pixel pitch in mm and PPI
  const getPixelPitch = (): { mm: string; ppi: string } => {
    const width = parseFloat(measurementWidth);
    const pxWidth = parseInt(pixelWidth);

    if (
      isNaN(width) ||
      width <= 0 ||
      isNaN(pxWidth) ||
      pxWidth <= 0
    ) {
      return { mm: "N/A", ppi: "N/A" };
    }

    // Convert width to inches
    let widthInInches = width;
    if (unit === "feet") widthInInches = width * 12;
    else if (unit === "cm") widthInInches = width / 2.54;
    else if (unit === "meters") widthInInches = width * 39.3701;

    const ppi = pxWidth / widthInInches;
    const pitchMm = 25.4 / ppi;

    return {
      mm: pitchMm.toFixed(2),
      ppi: ppi.toFixed(2),
    };
  };

  // Calculate optimal viewing distance (typically 1.5-2x screen height for comfortable viewing)
  const getOptimalViewingDistance = (): string => {
    const height = parseFloat(measurementHeight);

    if (isNaN(height) || height <= 0) {
      return "N/A";
    }

    // Convert to feet for display
    let heightInFeet = height;
    if (unit === "inches") heightInFeet = height / 12;
    else if (unit === "cm") heightInFeet = height / 30.48;
    else if (unit === "meters") heightInFeet = height * 3.28084;

    const optimalDistance = heightInFeet * 1.67; // Using 1.67x for optimal viewing
    return `${optimalDistance.toFixed(2)} ft`;
  };

  // Get resolution string
  const getResolution = (): string => {
    const width = parseFloat(pixelWidth) || 0;
    const height = parseFloat(pixelHeight) || 0;
    return `${width} × ${height}`;
  };

  // Calculate foot lamberts
  const getFootLamberts = (): string => {
    const lum = parseFloat(lumens);
    const gain = parseFloat(screenGain);
    const width = parseFloat(measurementWidth);
    const height = parseFloat(measurementHeight);

    if (
      isNaN(lum) ||
      isNaN(gain) ||
      isNaN(width) ||
      isNaN(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return "0 fL";
    }

    // Convert area to square feet
    let areaInSqFt = width * height;
    if (unit === "inches") areaInSqFt = (width * height) / 144;
    else if (unit === "cm")
      areaInSqFt = (width * height) / 929.03;
    else if (unit === "meters")
      areaInSqFt = width * height * 10.7639;

    // Calculate foot lamberts based on projector mode
    let footLamberts;
    if (projectorMode === "stacked") {
      // Stacked: All projectors cover the full surface, brightness multiplies
      footLamberts = (lum * gain * projectorCount) / areaInSqFt;
    } else if (
      projectorMode === "blended" &&
      projectorCount > 1
    ) {
      // Blended: Overlaps are gamma blended down to match single projector brightness
      footLamberts = (lum * gain) / areaInSqFt;
    } else {
      // Single projector
      footLamberts = (lum * gain) / areaInSqFt;
    }

    return `${footLamberts.toFixed(2)} fL`;
  };

  // Get foot lamberts value as number
  const getFootLambertsValue = (): number => {
    const lum = parseFloat(lumens);
    const gain = parseFloat(screenGain);
    const width = parseFloat(measurementWidth);
    const height = parseFloat(measurementHeight);

    if (
      isNaN(lum) ||
      isNaN(gain) ||
      isNaN(width) ||
      isNaN(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return 0;
    }

    // Convert area to square feet
    let areaInSqFt = width * height;
    if (unit === "inches") areaInSqFt = (width * height) / 144;
    else if (unit === "cm")
      areaInSqFt = (width * height) / 929.03;
    else if (unit === "meters")
      areaInSqFt = width * height * 10.7639;

    // Calculate foot lamberts based on projector mode
    if (projectorMode === "stacked") {
      // Stacked: All projectors cover the full surface, brightness multiplies
      return (lum * gain * projectorCount) / areaInSqFt;
    } else if (
      projectorMode === "blended" &&
      projectorCount > 1
    ) {
      // Blended: Overlaps are gamma blended down to match single projector brightness
      // In practice, the overlap regions are edge-blended to create seamless appearance
      // The brightness remains constant across the entire surface
      return (lum * gain) / areaInSqFt;
    } else {
      // Single projector
      return (lum * gain) / areaInSqFt;
    }
  };

  // Get color for foot lamberts based on value (smooth gradient)
  const getFootLambertsColor = (): {
    bg: string;
    text: string;
  } => {
    const fL = getFootLambertsValue();

    // Color stops: 0=red, 16=orange, 32=green, 48=yellow, 100=light yellow
    // Using RGB for smooth interpolation
    const colorStops = [
      {
        value: 0,
        bg: { r: 254, g: 202, b: 202 },
        text: { r: 127, g: 29, b: 29 },
      }, // red-200, red-900
      {
        value: 16,
        bg: { r: 254, g: 215, b: 170 },
        text: { r: 124, g: 45, b: 18 },
      }, // orange-200, orange-900
      {
        value: 32,
        bg: { r: 187, g: 247, b: 208 },
        text: { r: 20, g: 83, b: 45 },
      }, // green-200, green-900
      {
        value: 48,
        bg: { r: 254, g: 240, b: 138 },
        text: { r: 113, g: 63, b: 18 },
      }, // yellow-200, yellow-900
      {
        value: 100,
        bg: { r: 254, g: 249, b: 195 },
        text: { r: 161, g: 98, b: 7 },
      }, // yellow-100, yellow-800
    ];

    // Find the two stops to interpolate between
    let lowerStop = colorStops[0];
    let upperStop = colorStops[colorStops.length - 1];

    for (let i = 0; i < colorStops.length - 1; i++) {
      if (
        fL >= colorStops[i].value &&
        fL <= colorStops[i + 1].value
      ) {
        lowerStop = colorStops[i];
        upperStop = colorStops[i + 1];
        break;
      }
    }

    // If beyond 100, use the last stop
    if (fL > 100) {
      return {
        bg: `rgb(${colorStops[colorStops.length - 1].bg.r}, ${colorStops[colorStops.length - 1].bg.g}, ${colorStops[colorStops.length - 1].bg.b})`,
        text: `rgb(${colorStops[colorStops.length - 1].text.r}, ${colorStops[colorStops.length - 1].text.g}, ${colorStops[colorStops.length - 1].text.b})`,
      };
    }

    // Calculate interpolation factor
    const range = upperStop.value - lowerStop.value;
    const factor =
      range === 0 ? 0 : (fL - lowerStop.value) / range;

    // Interpolate RGB values
    const bgR = Math.round(
      lowerStop.bg.r +
      (upperStop.bg.r - lowerStop.bg.r) * factor,
    );
    const bgG = Math.round(
      lowerStop.bg.g +
      (upperStop.bg.g - lowerStop.bg.g) * factor,
    );
    const bgB = Math.round(
      lowerStop.bg.b +
      (upperStop.bg.b - lowerStop.bg.b) * factor,
    );

    const textR = Math.round(
      lowerStop.text.r +
      (upperStop.text.r - lowerStop.text.r) * factor,
    );
    const textG = Math.round(
      lowerStop.text.g +
      (upperStop.text.g - lowerStop.text.g) * factor,
    );
    const textB = Math.round(
      lowerStop.text.b +
      (upperStop.text.b - lowerStop.text.b) * factor,
    );

    return {
      bg: `rgb(${bgR}, ${bgG}, ${bgB})`,
      text: `rgb(${textR}, ${textG}, ${textB})`,
    };
  };

  // Calculate required lumens for target foot lamberts
  const calculateRequiredLumens = (targetFL: number): void => {
    const gain = parseFloat(screenGain);
    const width = parseFloat(measurementWidth);
    const height = parseFloat(measurementHeight);

    if (
      isNaN(gain) ||
      isNaN(width) ||
      isNaN(height) ||
      width <= 0 ||
      height <= 0 ||
      gain <= 0
    ) {
      alert("Please enter valid screen size and gain values");
      return;
    }

    // Convert area to square feet
    let areaInSqFt = width * height;
    if (unit === "inches") areaInSqFt = (width * height) / 144;
    else if (unit === "cm")
      areaInSqFt = (width * height) / 929.03;
    else if (unit === "meters")
      areaInSqFt = width * height * 10.7639;

    // fL = (Lumens × Gain) / Area
    // Therefore: Lumens = (fL × Area) / Gain
    const requiredLumens = (targetFL * areaInSqFt) / gain;
    setLumens(Math.round(requiredLumens).toString());
  };

  // Draw canvas preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pxW = parseInt(pixelWidth);
    const pxH = parseInt(pixelHeight);

    if (isNaN(pxW) || isNaN(pxH) || pxW <= 0 || pxH <= 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Scale to fit canvas while maintaining aspect ratio
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const scale =
      Math.min(canvasWidth / pxW, canvasHeight / pxH) * 0.9;

    const scaledWidth = pxW * scale;
    const scaledHeight = pxH * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;

    // Background and pattern colors based on mode
    const bgColor =
      patternMode === "light" ? "#e8e8e8" : "#1a1a1a";
    const gridPrimaryColor =
      patternMode === "light" ? "#ff0000" : "#ff0000";
    const gridSecondaryColor =
      patternMode === "light" ? "#888888" : "#404040";
    const textColor =
      patternMode === "light" ? "#000000" : "#ffffff";
    const circleColor =
      patternMode === "light" ? "#000000" : "#ffffff";

    // Clear canvas with background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw test pattern area
    ctx.fillStyle = bgColor;
    ctx.fillRect(offsetX, offsetY, scaledWidth, scaledHeight);

    // Draw fine grid lines (light gray/dark gray)
    ctx.strokeStyle = gridSecondaryColor;
    ctx.lineWidth = 0.5;
    const fineGridSpacingH = scaledWidth / 32; // More divisions for finer grid
    const fineGridSpacingV = scaledHeight / 18;

    for (let i = 0; i <= 32; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + i * fineGridSpacingH, offsetY);
      ctx.lineTo(
        offsetX + i * fineGridSpacingH,
        offsetY + scaledHeight,
      );
      ctx.stroke();
    }

    for (let i = 0; i <= 18; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + i * fineGridSpacingV);
      ctx.lineTo(
        offsetX + scaledWidth,
        offsetY + i * fineGridSpacingV,
      );
      ctx.stroke();
    }

    // Draw major grid lines (red, thicker)
    ctx.strokeStyle = gridPrimaryColor;
    ctx.lineWidth = 2;
    const majorGridSpacingH = scaledWidth / 4;
    const majorGridSpacingV = scaledHeight / 3;

    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + i * majorGridSpacingH, offsetY);
      ctx.lineTo(
        offsetX + i * majorGridSpacingH,
        offsetY + scaledHeight,
      );
      ctx.stroke();
    }

    for (let i = 0; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + i * majorGridSpacingV);
      ctx.lineTo(
        offsetX + scaledWidth,
        offsetY + i * majorGridSpacingV,
      );
      ctx.stroke();
    }

    // Center circle
    const centerX = offsetX + scaledWidth / 2;
    const centerY = offsetY + scaledHeight / 2;
    const centerRadius =
      Math.min(scaledWidth, scaledHeight) * 0.35;

    ctx.strokeStyle = circleColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Color bars in center
    const colorBarHeight = scaledHeight * 0.08;
    const colorBarY = centerY - colorBarHeight / 2;
    const colors = [
      "#FFFFFF",
      "#FFFF00",
      "#00FFFF",
      "#00FF00",
      "#FF00FF",
      "#FF0000",
      "#0000FF",
      "#000000",
    ];
    const colorBarWidth = (scaledWidth * 0.5) / colors.length;
    const colorBarsStartX = centerX - scaledWidth * 0.25;

    colors.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        colorBarsStartX + index * colorBarWidth,
        colorBarY,
        colorBarWidth,
        colorBarHeight,
      );
    });

    // Text in center
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Test pattern name
    const nameFontSize =
      Math.min(scaledWidth, scaledHeight) * 0.06;
    ctx.font = `${nameFontSize}px sans-serif`;
    ctx.fillText(
      testPatternName || "Test Pattern",
      centerX,
      centerY - scaledHeight * 0.15,
    );

    // Resolution
    const resFontSize =
      Math.min(scaledWidth, scaledHeight) * 0.055;
    ctx.font = `${resFontSize}px sans-serif`;
    ctx.fillText(
      `${pxW}px × ${pxH}px`,
      centerX,
      centerY - scaledHeight * 0.08,
    );

    // Additional info
    const infoFontSize =
      Math.min(scaledWidth, scaledHeight) * 0.03;
    ctx.font = `${infoFontSize}px sans-serif`;
    const aspectRatio = getAspectRatio();
    const pixelPitch = getPixelPitch();
    const surfaceWidth = parseFloat(measurementWidth);
    const surfaceHeight = parseFloat(measurementHeight);

    ctx.fillText(
      `Aspect Ratio: ${aspectRatio} (${(surfaceWidth / surfaceHeight).toFixed(2)}:1)`,
      centerX,
      centerY + scaledHeight * 0.1,
    );
    ctx.fillText(
      `Pixel Pitch: ${pixelPitch.mm} mm`,
      centerX,
      centerY + scaledHeight * 0.14,
    );
    const unitLabel = getUnitLabel();
    const diagonal = getDiagonalSize();
    ctx.fillText(
      `Surface Dimension: ${surfaceWidth.toFixed(1)}${unitLabel} x ${surfaceHeight.toFixed(1)}${unitLabel} (${diagonal}${unitLabel} diagonal)`,
      centerX,
      centerY + scaledHeight * 0.18,
    );
  }, [
    pixelWidth,
    pixelHeight,
    testPatternName,
    measurementWidth,
    measurementHeight,
    patternMode,
    unit,
    activeTab,
  ]);

  // Draw projector canvas preview
  useEffect(() => {
    const canvas = projectorCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI scaling for crisp rendering - responsive width
    const dpr = window.devicePixelRatio || 1;
    const containerWidth =
      canvas.parentElement?.clientWidth || 600;
    const displayWidth = Math.min(containerWidth, 600);
    // Make taller on mobile for better visibility
    const isMobile = displayWidth < 500;
    const displayHeight = isMobile
      ? displayWidth * 0.85
      : displayWidth * (350 / 600);

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + "px";
    canvas.style.height = displayHeight + "px";

    ctx.scale(dpr, dpr);

    const canvasWidth = displayWidth;
    const canvasHeight = displayHeight;
    const ratio = parseFloat(throwRatio) || 1.5;
    const surfaceWidth = parseFloat(measurementWidth) || 18;
    const surfaceHeight = parseFloat(measurementHeight) || 9;
    const nativeW = parseFloat(projectorNativeWidth) || 1920;
    const nativeH = parseFloat(projectorNativeHeight) || 1080;
    const aspectRatio = nativeW / nativeH;

    // Calculate lumens and foot lamberts for labels
    const calculatedLumens = parseFloat(lumens) || 0;
    const gain = parseFloat(screenGain) || 1;

    // Calculate the ACTUAL PROJECTED dimensions (not surface dimensions)
    // This is critical for foot-lamberts because fL = lumens / projected area
    let projectedWidth;
    let projectedHeight;

    if (blendScaleMode === "width") {
      // Scale to Width: Width matches surface, calculate height based on aspect ratio
      projectedWidth = surfaceWidth;
      if (projectorOrientation === "landscape") {
        const pixelPitchFt = surfaceWidth / nativeW;
        projectedHeight = nativeH * pixelPitchFt;
      } else {
        const pixelPitchFt = surfaceWidth / nativeH;
        projectedHeight = nativeW * pixelPitchFt;
      }
    } else {
      // Scale to Height: Height matches surface, calculate width based on aspect ratio
      projectedHeight = surfaceHeight;
      if (projectorOrientation === "landscape") {
        const pixelPitchFt = surfaceHeight / nativeH;
        projectedWidth = nativeW * pixelPitchFt;
      } else {
        const pixelPitchFt = surfaceHeight / nativeW;
        projectedHeight = nativeH * pixelPitchFt;
      }
    }

    // Convert PROJECTED area to square feet for foot lamberts calculation
    let projectedAreaInSqFt = projectedWidth * projectedHeight;
    if (unit === "inches")
      projectedAreaInSqFt =
        (projectedWidth * projectedHeight) / 144;
    else if (unit === "cm")
      projectedAreaInSqFt =
        (projectedWidth * projectedHeight) / 929.03;
    else if (unit === "meters")
      projectedAreaInSqFt =
        projectedWidth * projectedHeight * 10.7639;

    // Calculate brightness multiplier based on projector mode
    let brightnessMultiplier = 1;
    if (projectorMode === "stacked") {
      // Stacked: All projectors cover the full surface, brightness multiplies
      brightnessMultiplier = projectorCount;
    } else if (
      projectorMode === "blended" &&
      projectorCount > 1
    ) {
      // Blended: Overlaps are gamma blended down to match single projector brightness
      brightnessMultiplier = 1;
    }
    const calculatedFootLamberts =
      (calculatedLumens * gain * brightnessMultiplier) /
      projectedAreaInSqFt;

    // Calculate individual projector width and throw distance for blended mode
    let individualProjectorWidth = surfaceWidth;
    let calculatedThrowDistance;

    if (projectorMode === "blended" && projectorCount > 1) {
      const overlapDecimal = blendOverlap / 100;

      if (blendScaleMode === "width") {
        // Scale to Width: Each projector's width is calculated to cover the surface width
        individualProjectorWidth =
          surfaceWidth /
          (projectorCount -
            (projectorCount - 1) * overlapDecimal);
      } else {
        // Scale to Height: Calculate width based on height and native aspect ratio
        if (projectorOrientation === "landscape") {
          const pixelPitchFt = surfaceHeight / nativeH;
          individualProjectorWidth = nativeW * pixelPitchFt;
        } else {
          const pixelPitchFt = surfaceHeight / nativeW;
          individualProjectorWidth = nativeH * pixelPitchFt;
        }
      }

      // Throw distance based on individual projector's coverage
      calculatedThrowDistance =
        projectorOrientation === "landscape"
          ? ratio * individualProjectorWidth
          : ratio * individualProjectorWidth * aspectRatio;
    } else {
      // Single or stacked: respect blendScaleMode
      if (blendScaleMode === "width") {
        // Scale to Width: projector width matches surface width
        individualProjectorWidth = surfaceWidth;
        calculatedThrowDistance =
          projectorOrientation === "landscape"
            ? ratio * surfaceWidth
            : ratio * surfaceWidth * aspectRatio;
      } else {
        // Scale to Height: calculate width based on height and aspect ratio
        if (projectorOrientation === "landscape") {
          const pixelPitchFt = surfaceHeight / nativeH;
          individualProjectorWidth = nativeW * pixelPitchFt;
        } else {
          const pixelPitchFt = surfaceHeight / nativeW;
          individualProjectorWidth = nativeH * pixelPitchFt;
        }
        calculatedThrowDistance =
          projectorOrientation === "landscape"
            ? ratio * individualProjectorWidth
            : ratio * individualProjectorWidth * aspectRatio;
      }
    }

    // Clear canvas
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const padding = isMobile ? 40 : 60;
    const availableWidth = canvasWidth - padding * 2;
    const availableHeight = canvasHeight - padding * 2;

    // Font sizes - scale on mobile
    const baseFontSize = isMobile ? 11 : 14;
    const smallFontSize = isMobile ? 9 : 12;
    const tinyFontSize = isMobile ? 8 : 10;
    const labelFontSize = isMobile ? 9 : 11;

    if (diagramView === "plan") {
      // ===== TOP PLAN VIEW =====
      // ===== TOP PLAN VIEW =====
      // Surface stays mostly fixed, projector subtly moves to show throw distance change

      const scaleX = availableWidth / surfaceWidth;
      const scaleY = availableHeight / calculatedThrowDistance;
      const scale = Math.min(scaleX, scaleY) * 0.8;

      const surfaceY = padding;
      const surfaceWidth_scaled = surfaceWidth * scale;
      const surfaceLeftX =
        canvasWidth / 2 - surfaceWidth_scaled / 2;
      const surfaceRightX =
        canvasWidth / 2 + surfaceWidth_scaled / 2;

      const projectorWidth =
        projectorOrientation === "landscape" ? 40 : 20;
      const projectorHeight =
        projectorOrientation === "landscape" ? 30 : 40;

      // Projector moves slightly based on throw ratio to give sense of distance
      // Base position near bottom, then add subtle offset based on throw distance
      const baseProjectorY =
        canvasHeight - padding - projectorHeight - 100;
      const throwOffsetRange = 60; // Max pixels projector can move
      const minThrow = 0.5; // Typical minimum throw ratio
      const maxThrow = 3.0; // Typical maximum throw ratio
      const throwNormalized = Math.min(
        Math.max(
          (throwRatio - minThrow) / (maxThrow - minThrow),
          0,
        ),
        1,
      );
      const projectorY =
        baseProjectorY + throwOffsetRange * throwNormalized;

      // Draw projection cones and projectors based on mode
      if (projectorMode === "blended" && projectorCount > 1) {
        // BLENDED MODE: Multiple projectors side by side
        const overlapDecimal = blendOverlap / 100;
        const overlapWidth =
          individualProjectorWidth * overlapDecimal;
        const nonOverlappingWidth =
          individualProjectorWidth - overlapWidth;

        // Calculate total projected width (all projectors combined)
        const totalProjectedWidth =
          individualProjectorWidth * projectorCount -
          overlapWidth * (projectorCount - 1);

        // For "Scale to Width" mode, projections align with surface
        // For "Scale to Height" mode, show overflow/underflow
        const projectedLeftX =
          canvasWidth / 2 - (totalProjectedWidth * scale) / 2;
        const projectedRightX =
          canvasWidth / 2 + (totalProjectedWidth * scale) / 2;

        // Calculate projector positions
        for (let i = 0; i < projectorCount; i++) {
          // Each projector starts at i * (non-overlapping width)
          const coverageStart = i * nonOverlappingWidth;
          const coverageEnd =
            coverageStart + individualProjectorWidth;
          const coverageCenter =
            (coverageStart + coverageEnd) / 2;

          const leftEdgeX =
            projectedLeftX + coverageStart * scale;
          const rightEdgeX =
            projectedLeftX + coverageEnd * scale;
          const projectorCenterX =
            projectedLeftX + coverageCenter * scale;

          // Draw projection cone
          ctx.strokeStyle = "#ef4444";
          ctx.fillStyle = "#ef444420";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(projectorCenterX, projectorY);
          ctx.lineTo(leftEdgeX, surfaceY);
          ctx.lineTo(rightEdgeX, surfaceY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Draw throw distance line
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(projectorCenterX, surfaceY);
          ctx.lineTo(projectorCenterX, projectorY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw overflow/underflow regions (for Scale to Height mode)
        const widthDiff = totalProjectedWidth - surfaceWidth;
        if (
          blendScaleMode === "height" &&
          Math.abs(widthDiff) > 0.01
        ) {
          if (widthDiff > 0) {
            // OVERFLOW: projected > surface
            const overflowAmount_scaled =
              (widthDiff / 2) * scale;

            // Left overflow (red)
            ctx.fillStyle = "#ef444460";
            ctx.fillRect(
              projectedLeftX,
              surfaceY - 5,
              overflowAmount_scaled,
              10,
            );

            // Right overflow (red)
            ctx.fillRect(
              surfaceRightX,
              surfaceY - 5,
              overflowAmount_scaled,
              10,
            );

            // Draw overflow markers (red lines at the edges)
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(projectedLeftX, surfaceY - 15);
            ctx.lineTo(projectedLeftX, surfaceY + 15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(projectedRightX, surfaceY - 15);
            ctx.lineTo(projectedRightX, surfaceY + 15);
            ctx.stroke();
          } else {
            // UNDERFLOW: projected < surface
            const underflowAmount_scaled =
              (Math.abs(widthDiff) / 2) * scale;

            // Left underflow (dark red)
            ctx.fillStyle = "#dc262660";
            ctx.fillRect(
              surfaceLeftX,
              surfaceY - 5,
              underflowAmount_scaled,
              10,
            );

            // Right underflow (dark red)
            ctx.fillRect(
              projectedRightX,
              surfaceY - 5,
              underflowAmount_scaled,
              10,
            );
          }
        }

        // Draw surface (blue filled rectangle)
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(
          surfaceLeftX,
          surfaceY - 3,
          surfaceWidth * scale,
          6,
        );

        // Draw projectors
        for (let i = 0; i < projectorCount; i++) {
          const coverageStart = i * nonOverlappingWidth;
          const coverageEnd =
            coverageStart + individualProjectorWidth;
          const coverageCenter =
            (coverageStart + coverageEnd) / 2;
          const projectorCenterX =
            projectedLeftX + coverageCenter * scale;
          const projectorX =
            projectorCenterX - projectorWidth / 2;

          ctx.fillStyle = "#3b82f6";
          ctx.fillRect(
            projectorX,
            projectorY,
            projectorWidth,
            projectorHeight,
          );
          ctx.fillStyle = "#1e40af";
          ctx.beginPath();
          ctx.arc(
            projectorCenterX,
            projectorY,
            5,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      } else {
        // SINGLE or STACKED MODE
        const projectorX = canvasWidth / 2 - projectorWidth / 2;

        // Calculate projected width based on scale mode
        const projectedWidth_scaled =
          individualProjectorWidth * scale;
        const projectedLeftX =
          canvasWidth / 2 - projectedWidth_scaled / 2;
        const projectedRightX =
          canvasWidth / 2 + projectedWidth_scaled / 2;

        // Draw projection cone (to projected width, not surface width)
        ctx.strokeStyle = "#ef4444";
        ctx.fillStyle = "#ef444420";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvasWidth / 2, projectorY);
        ctx.lineTo(projectedLeftX, surfaceY);
        ctx.lineTo(projectedRightX, surfaceY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw overflow/underflow regions (for Scale to Height mode)
        const widthDiff =
          individualProjectorWidth - surfaceWidth;
        if (
          blendScaleMode === "height" &&
          Math.abs(widthDiff) > 0.01
        ) {
          if (widthDiff > 0) {
            // OVERFLOW: projected > surface
            const overflowAmount_scaled =
              (widthDiff / 2) * scale;

            // Left overflow (red bar)
            ctx.fillStyle = "#ef444460";
            ctx.fillRect(
              projectedLeftX,
              surfaceY - 5,
              overflowAmount_scaled,
              10,
            );

            // Right overflow (red bar)
            ctx.fillRect(
              surfaceRightX,
              surfaceY - 5,
              overflowAmount_scaled,
              10,
            );

            // Draw overflow markers (red vertical lines at the projection edges)
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(projectedLeftX, surfaceY - 15);
            ctx.lineTo(projectedLeftX, surfaceY + 15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(projectedRightX, surfaceY - 15);
            ctx.lineTo(projectedRightX, surfaceY + 15);
            ctx.stroke();
          } else {
            // UNDERFLOW: projected < surface (rare, but possible)
            const underflowAmount_scaled =
              Math.abs(widthDiff / 2) * scale;

            // Left underflow (dark red)
            ctx.fillStyle = "#dc262660";
            ctx.fillRect(
              surfaceLeftX,
              surfaceY - 5,
              underflowAmount_scaled,
              10,
            );

            // Right underflow (dark red)
            ctx.fillRect(
              projectedRightX,
              surfaceY - 5,
              underflowAmount_scaled,
              10,
            );
          }
        }

        // Draw surface (blue filled rectangle)
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(
          surfaceLeftX,
          surfaceY - 3,
          surfaceWidth * scale,
          6,
        );

        // Draw throw distance line
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(canvasWidth / 2, surfaceY);
        ctx.lineTo(canvasWidth / 2, projectorY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw projector
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(
          projectorX,
          projectorY,
          projectorWidth,
          projectorHeight,
        );

        // Add "×N" text for stacked mode
        if (projectorMode === "stacked" && projectorCount > 1) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 16px system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            `×${projectorCount}`,
            canvasWidth / 2,
            projectorY + projectorHeight / 2,
          );
        }

        ctx.fillStyle = "#1e40af";
        ctx.beginPath();
        ctx.arc(canvasWidth / 2, projectorY, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Labels
      const unitLabel = getUnitLabel();

      ctx.fillStyle = "#3b82f6";
      ctx.font = `${baseFontSize}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Surface Width label - just above the surface line
      ctx.fillText(
        `Surface Width: ${surfaceWidth.toFixed(1)}${unitLabel}`,
        canvasWidth / 2,
        surfaceY - 15,
      );

      // Throw distance label - above Surface Width with proper spacing
      ctx.fillText(
        `Throw Distance: ${calculatedThrowDistance.toFixed(2)} ${unitLabel}`,
        canvasWidth / 2,
        surfaceY - 35,
      );

      // Always show throw ratio (centered below projector)
      ctx.textAlign = "center";
      ctx.fillText(
        `Throw Ratio: ${ratio}`,
        canvasWidth / 2,
        projectorY + projectorHeight + 20,
      );

      // Hide detailed text on mobile - shown in info section below canvas instead
      if (!isMobile) {
        ctx.font = `${smallFontSize}px system-ui`;
        const orientationText =
          projectorOrientation === "landscape"
            ? "(Landscape)"
            : `(Portrait 90° - ${aspectRatio.toFixed(2)}x longer)`;
        ctx.fillText(
          orientationText,
          canvasWidth / 2,
          projectorY + projectorHeight + 35,
        );

        // Smaller info labels - position at bottom to avoid overlapping with projection cones
        ctx.font = `${tinyFontSize}px system-ui`;
        let labelOffsetY = canvasHeight - padding - 20;

        // Show projector mode info
        if (projectorMode === "stacked") {
          ctx.fillText(
            `${projectorCount}× ${calculatedLumens.toLocaleString()} ANSI lumens (Stacked)`,
            canvasWidth / 2,
            labelOffsetY,
          );
        } else if (projectorMode === "blended") {
          labelOffsetY -= 12;
          ctx.fillText(
            `Each: ${individualProjectorWidth.toFixed(1)}${unitLabel} wide, ${calculatedLumens.toLocaleString()} lumens`,
            canvasWidth / 2,
            labelOffsetY,
          );
          labelOffsetY += 12;
          ctx.fillText(
            `${projectorCount}× projectors, ${blendOverlap}% overlap`,
            canvasWidth / 2,
            labelOffsetY,
          );
        } else {
          ctx.fillText(
            `${calculatedLumens.toLocaleString()} ANSI lumens`,
            canvasWidth / 2,
            labelOffsetY,
          );
        }

        ctx.fillText(
          `${calculatedFootLamberts.toFixed(1)} fL`,
          canvasWidth / 2,
          surfaceY - 55,
        );
      }

      // View label - hide on mobile since toggle buttons show the view
      if (!isMobile) {
        ctx.fillStyle = "#64748b";
        ctx.font = `${labelFontSize}px system-ui`;
        ctx.textAlign = "left";
        ctx.fillText("Top/Plan View", padding, padding - 35);
      }
    } else {
      // ===== SECTION VIEW (Side Elevation) =====
      // Projector on LEFT, Screen on RIGHT

      // Calculate projected height
      let projectedHeight;
      let individualProjectorWidth = surfaceWidth; // For single/stacked, full width

      // For blended mode, calculate individual projector dimensions
      if (projectorMode === "blended" && projectorCount > 1) {
        const overlapDecimal = blendOverlap / 100;

        if (blendScaleMode === "width") {
          // Scale to Width: Fit width, calculate height
          individualProjectorWidth =
            surfaceWidth /
            (projectorCount -
              (projectorCount - 1) * overlapDecimal);

          if (projectorOrientation === "landscape") {
            const pixelPitchFt =
              individualProjectorWidth / nativeW;
            projectedHeight = nativeH * pixelPitchFt;
          } else {
            const pixelPitchFt =
              individualProjectorWidth / nativeH;
            projectedHeight = nativeW * pixelPitchFt;
          }
        } else {
          // Scale to Height: Fit height, calculate width
          projectedHeight = surfaceHeight;

          if (projectorOrientation === "landscape") {
            const pixelPitchFt = surfaceHeight / nativeH;
            individualProjectorWidth = nativeW * pixelPitchFt;
          } else {
            const pixelPitchFt = surfaceHeight / nativeW;
            individualProjectorWidth = nativeH * pixelPitchFt;
          }
        }
      } else {
        // Single or stacked mode: respect blendScaleMode
        if (blendScaleMode === "width") {
          // Scale to Width: Fit width, calculate height
          individualProjectorWidth = surfaceWidth;

          if (projectorOrientation === "landscape") {
            const pixelPitchFt =
              individualProjectorWidth / nativeW;
            projectedHeight = nativeH * pixelPitchFt;
          } else {
            const pixelPitchFt =
              individualProjectorWidth / nativeH;
            projectedHeight = nativeW * pixelPitchFt;
          }
        } else {
          // Scale to Height: Fit height, calculate width
          projectedHeight = surfaceHeight;

          if (projectorOrientation === "landscape") {
            const pixelPitchFt = surfaceHeight / nativeH;
            individualProjectorWidth = nativeW * pixelPitchFt;
          } else {
            const pixelPitchFt = surfaceHeight / nativeW;
            individualProjectorWidth = nativeH * pixelPitchFt;
          }
        }
      }

      const heightDiff = projectedHeight - surfaceHeight;
      const maxHeight = Math.max(
        surfaceHeight,
        projectedHeight,
      );

      // Surface stays mostly fixed, projector subtly moves to show throw distance change
      const projectorWidth =
        projectorOrientation === "landscape" ? 40 : 30;
      const projectorHeight =
        projectorOrientation === "landscape" ? 30 : 50;

      // Calculate scale based on surface dimensions (stays constant)
      const scaleX = availableWidth / calculatedThrowDistance;
      const scaleY = availableHeight / maxHeight;
      const scale = Math.min(scaleX, scaleY) * 0.75;

      // Center everything vertically
      const projectorCenterY = canvasHeight / 2;

      // Screen position (RIGHT side) - FIXED vertical line
      const screenX = canvasWidth - padding - 100;
      const surfaceHeight_scaled = surfaceHeight * scale;
      const projectedHeight_scaled = projectedHeight * scale;

      // Projector moves subtly based on throw ratio
      // Base position on left, then add subtle offset based on throw distance
      const baseProjectorX = padding + 50;
      const throwOffsetRange = 80; // Max pixels projector can move
      const minThrow = 0.5; // Typical minimum throw ratio
      const maxThrow = 3.0; // Typical maximum throw ratio
      const throwNormalized = Math.min(
        Math.max(
          (throwRatio - minThrow) / (maxThrow - minThrow),
          0,
        ),
        1,
      );
      const projectorX =
        baseProjectorX - throwOffsetRange * throwNormalized; // Move LEFT as throw increases (further away)

      const projectorY = projectorCenterY - projectorHeight / 2;
      const projectorLensX = projectorX + projectorWidth;

      const surfaceTopY =
        projectorCenterY - surfaceHeight_scaled / 2;
      const surfaceBottomY =
        projectorCenterY + surfaceHeight_scaled / 2;
      const projectedTopY =
        projectorCenterY - projectedHeight_scaled / 2;
      const projectedBottomY =
        projectorCenterY + projectedHeight_scaled / 2;

      // Draw projection cone(s) based on mode
      if (projectorMode === "stacked" && projectorCount > 1) {
        // STACKED MODE: Draw multiple projectors vertically stacked
        const stackSpacing = 8; // Spacing between stacked projectors
        const totalStackHeight =
          projectorCount * projectorHeight +
          (projectorCount - 1) * stackSpacing;
        const stackStartY =
          projectorCenterY - totalStackHeight / 2;

        // Draw each projector in the stack
        for (let i = 0; i < projectorCount; i++) {
          const thisProjectorY =
            stackStartY + i * (projectorHeight + stackSpacing);
          const thisProjectorCenterY =
            thisProjectorY + projectorHeight / 2;
          const thisLensX = projectorX + projectorWidth;

          // Draw projection cone from this projector's lens to same spot on screen
          ctx.strokeStyle = "#ef4444";
          ctx.fillStyle = "#ef444420";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(thisLensX, thisProjectorCenterY);
          ctx.lineTo(screenX, projectedTopY);
          ctx.lineTo(screenX, projectedBottomY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else {
        // SINGLE or BLENDED MODE: Draw single cone
        ctx.strokeStyle = "#ef4444";
        ctx.fillStyle = "#ef444420";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(projectorLensX, projectorCenterY);
        ctx.lineTo(screenX, projectedTopY);
        ctx.lineTo(screenX, projectedBottomY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Draw overflow/underflow regions
      if (heightDiff > 0.01) {
        // OVERFLOW: projected > surface
        const overflowAmount_scaled = (heightDiff / 2) * scale;

        // Top overflow (red)
        ctx.fillStyle = "#ef444460";
        ctx.fillRect(
          screenX - 5,
          projectedTopY,
          10,
          overflowAmount_scaled,
        );

        // Bottom overflow (red)
        ctx.fillRect(
          screenX - 5,
          surfaceBottomY,
          10,
          overflowAmount_scaled,
        );

        // Draw overflow markers
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX - 15, projectedTopY);
        ctx.lineTo(screenX + 15, projectedTopY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX - 15, projectedBottomY);
        ctx.lineTo(screenX + 15, projectedBottomY);
        ctx.stroke();
      } else if (heightDiff < -0.01) {
        // UNDERFLOW: projected < surface
        const underflowAmount_scaled =
          (Math.abs(heightDiff) / 2) * scale;

        // Top underflow (dark red)
        ctx.fillStyle = "#dc262660";
        ctx.fillRect(
          screenX - 5,
          surfaceTopY,
          10,
          underflowAmount_scaled,
        );

        // Bottom underflow (dark red)
        ctx.fillRect(
          screenX - 5,
          projectedBottomY,
          10,
          underflowAmount_scaled,
        );
      }

      // Draw SURFACE (blue vertical line) - the target
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(screenX, surfaceTopY);
      ctx.lineTo(screenX, surfaceBottomY);
      ctx.stroke();

      // Draw surface edge markers (blue circles)
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(screenX, surfaceTopY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(screenX, surfaceBottomY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw throw distance line (dashed horizontal at center)
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(projectorLensX, projectorCenterY);
      ctx.lineTo(screenX, projectorCenterY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw ground line
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padding, canvasHeight - padding);
      ctx.lineTo(screenX + 20, canvasHeight - padding);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw projector(s) based on mode
      if (projectorMode === "stacked" && projectorCount > 1) {
        // STACKED MODE: Draw multiple projector rectangles stacked vertically
        const stackSpacing = 8;
        const totalStackHeight =
          projectorCount * projectorHeight +
          (projectorCount - 1) * stackSpacing;
        const stackStartY =
          projectorCenterY - totalStackHeight / 2;

        for (let i = 0; i < projectorCount; i++) {
          const thisProjectorY =
            stackStartY + i * (projectorHeight + stackSpacing);
          const thisProjectorCenterY =
            thisProjectorY + projectorHeight / 2;
          const thisLensX = projectorX + projectorWidth;

          // Draw projector rectangle
          ctx.fillStyle = "#3b82f6";
          ctx.fillRect(
            projectorX,
            thisProjectorY,
            projectorWidth,
            projectorHeight,
          );

          // Draw projector lens (dark blue circle)
          ctx.fillStyle = "#1e40af";
          ctx.beginPath();
          ctx.arc(
            thisLensX,
            thisProjectorCenterY,
            6,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      } else {
        // SINGLE or BLENDED MODE: Draw single projector
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(
          projectorX,
          projectorY,
          projectorWidth,
          projectorHeight,
        );

        // Draw projector lens (dark blue circle)
        ctx.fillStyle = "#1e40af";
        ctx.beginPath();
        ctx.arc(
          projectorLensX,
          projectorCenterY,
          6,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      // Labels
      const unitLabel = getUnitLabel();
      ctx.fillStyle = "#3b82f6";
      ctx.font = `${baseFontSize}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Throw distance label (above center line, horizontal)
      const throwDistanceLabelX =
        projectorLensX + (screenX - projectorLensX) / 2;
      ctx.fillText(
        `Throw Distance: ${calculatedThrowDistance.toFixed(2)} ${unitLabel}`,
        throwDistanceLabelX,
        projectorCenterY - (isMobile ? 60 : 80),
      );

      // Surface height label (right of screen) - positioned further right to avoid overlap
      ctx.save();
      ctx.translate(
        screenX + (isMobile ? 30 : 45),
        projectorCenterY,
      );
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "#3b82f6";
      ctx.font = `${smallFontSize}px system-ui`;
      ctx.textAlign = "center";
      const surfaceDiagonal = getDiagonalSize();
      ctx.fillText(
        `Surface: ${surfaceHeight.toFixed(1)}${unitLabel}`,
        0,
        0,
      );
      // Diagonal on second line - increased spacing
      ctx.font = `${tinyFontSize}px system-ui`;
      ctx.fillText(
        `(${surfaceDiagonal}${unitLabel} diag)`,
        0,
        isMobile ? 12 : 15,
      );
      ctx.restore();

      // Projected height label (left of screen if overflow)
      if (Math.abs(heightDiff) > 0.01) {
        ctx.save();
        ctx.translate(
          screenX - (isMobile ? 20 : 25),
          projectorCenterY,
        );
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = "#3b82f6";
        ctx.font = `${labelFontSize}px system-ui`;
        ctx.fillText(
          `Projected: ${projectedHeight.toFixed(1)}${unitLabel}`,
          0,
          0,
        );
        ctx.restore();
      }

      // Always show throw ratio (above projector, moved up more for stacked mode)
      ctx.fillStyle = "#3b82f6";
      ctx.font = `${smallFontSize}px system-ui`;
      ctx.textAlign = "left";
      const ratioYOffset =
        projectorMode === "stacked" && projectorCount > 1
          ? projectorY - projectorCount * 30
          : projectorY - 10;
      ctx.fillText(
        `Throw Ratio: ${ratio}`,
        projectorX,
        ratioYOffset,
      );

      // Hide detailed text on mobile - shown in info section below canvas instead
      if (!isMobile) {
        // Lumens/Mode label (below projector, moved down more for stacked mode, smaller text)
        ctx.font = `${tinyFontSize}px system-ui`;
        const lumensYOffset =
          projectorMode === "stacked" && projectorCount > 1
            ? projectorY + projectorHeight + projectorCount * 30
            : projectorY + projectorHeight + 15;
        if (projectorMode === "stacked") {
          ctx.fillText(
            `${projectorCount}× ${calculatedLumens.toLocaleString()} lumens (Stacked)`,
            projectorX,
            lumensYOffset,
          );
        } else if (projectorMode === "blended") {
          ctx.fillText(
            `${projectorCount}× proj, ${blendOverlap}% overlap`,
            projectorX,
            lumensYOffset,
          );
        } else {
          ctx.fillText(
            `${calculatedLumens.toLocaleString()} ANSI lumens`,
            projectorX,
            lumensYOffset,
          );
        }

        // Foot lamberts label (right of screen, rotated, smaller text) - positioned further right
        ctx.save();
        ctx.translate(screenX + (isMobile ? 50 : 75), projectorCenterY);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = "#3b82f6";
        ctx.font = `${tinyFontSize}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(
          `${calculatedFootLamberts.toFixed(1)} fL`,
          0,
          0,
        );
        ctx.restore();
      }

      // Status message (bottom) - show different message based on scale mode
      ctx.textAlign = "center";
      ctx.font = `${isMobile ? 12 : 15}px system-ui`;

      if (blendScaleMode === "height") {
        // In "Scale to Height" mode, height fits perfectly, show WIDTH difference
        const widthDiff =
          individualProjectorWidth - surfaceWidth;

        if (widthDiff > 0.01) {
          ctx.fillStyle = "#ea580c";
          ctx.fillText(
            `⚠ Overflow: ${widthDiff.toFixed(1)}${unitLabel} total (${(widthDiff / 2).toFixed(1)}${unitLabel} left & right)`,
            canvasWidth / 2,
            canvasHeight - 80,
          );
        } else if (widthDiff < -0.01) {
          ctx.fillStyle = "#dc2626";
          ctx.fillText(
            `❌ Underflow: ${Math.abs(widthDiff).toFixed(1)}${unitLabel} short (${Math.abs(widthDiff / 2).toFixed(1)}${unitLabel} left & right)`,
            canvasWidth / 2,
            canvasHeight - 80,
          );
        } else {
          ctx.fillStyle = "#16a34a";
          ctx.fillText(
            `✅ Perfect width match!`,
            canvasWidth / 2,
            canvasHeight - 80,
          );
        }
      } else {
        // In "Scale to Width" mode, width fits perfectly, show HEIGHT difference
        if (heightDiff > 0.01) {
          ctx.fillStyle = "#ea580c";
          ctx.fillText(
            `⚠ Overflow: ${heightDiff.toFixed(1)}${unitLabel} total (${(heightDiff / 2).toFixed(1)}${unitLabel} top & bottom)`,
            canvasWidth / 2,
            canvasHeight - 80,
          );
        } else if (heightDiff < -0.01) {
          ctx.fillStyle = "#dc2626";
          ctx.fillText(
            `❌ Underflow: ${Math.abs(heightDiff).toFixed(1)}${unitLabel} short (${Math.abs(heightDiff / 2).toFixed(1)}${unitLabel} top & bottom)`,
            canvasWidth / 2,
            canvasHeight - 80,
          );
        } else {
          ctx.fillStyle = "#16a34a";
          ctx.fillText(
            `✅ Perfect height match!`,
            canvasWidth / 2,
            canvasHeight - 80,
          );
        }
      }

      // View label - hide on mobile since toggle buttons show the view
      if (!isMobile) {
        ctx.fillStyle = "#64748b";
        ctx.font = `${labelFontSize}px system-ui`;
        ctx.textAlign = "left";
        ctx.fillText("Section View", padding, padding - 35);
      }
    }
  }, [
    throwRatio,
    measurementWidth,
    measurementHeight,
    projectorOrientation,
    projectorNativeWidth,
    projectorNativeHeight,
    diagramView,
    unit,
    lumens,
    screenGain,
    activeTab,
    projectorMode,
    projectorCount,
    blendOverlap,
    blendScaleMode,
  ]);

  // Draw simple overlay preview for difference section
  useEffect(() => {
    const canvas = differenceCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 500;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const padding = 40;

    const nativeW = parseFloat(projectorNativeWidth) || 1920;
    const nativeH = parseFloat(projectorNativeHeight) || 1080;
    const surfaceW = parseFloat(measurementWidth) || 18;
    const surfaceH = parseFloat(measurementHeight) || 9;

    // Calculate projector output dimensions
    let projectorOutputW, projectorOutputH;

    // For blended mode, each projector maintains its native aspect ratio
    if (projectorMode === "blended" && projectorCount > 1) {
      const overlapDecimal = blendOverlap / 100;

      if (blendScaleMode === "width") {
        // Scale to Width: Fit width perfectly, height may overflow/underflow
        if (projectorOrientation === "landscape") {
          // Total coverage = individualWidth * N - overlap * (N-1)
          // surfaceW = individualWidth * (N - (N-1) * overlap)
          const individualProjectorW =
            surfaceW /
            (projectorCount -
              (projectorCount - 1) * overlapDecimal);
          const pixelPitchW = individualProjectorW / nativeW;
          projectorOutputW = individualProjectorW;
          projectorOutputH = nativeH * pixelPitchW;
        } else {
          // Portrait: projector is rotated 90 degrees
          const individualProjectorW =
            surfaceW /
            (projectorCount -
              (projectorCount - 1) * overlapDecimal);
          const pixelPitchW = individualProjectorW / nativeH;
          projectorOutputW = individualProjectorW;
          projectorOutputH = nativeW * pixelPitchW;
        }
      } else {
        // Scale to Height: Fit height perfectly, width may overflow/underflow
        if (projectorOrientation === "landscape") {
          // Each projector's height matches the surface height
          const pixelPitchH = surfaceH / nativeH;
          projectorOutputW = nativeW * pixelPitchH;
          projectorOutputH = surfaceH;
        } else {
          // Portrait: projector is rotated 90 degrees
          const pixelPitchH = surfaceH / nativeW;
          projectorOutputW = nativeH * pixelPitchH;
          projectorOutputH = surfaceH;
        }
      }
    } else {
      // Single projector or stacked mode - respect blendScaleMode
      if (blendScaleMode === "width") {
        // Scale to Width: Fit width perfectly, height may overflow/underflow
        if (projectorOrientation === "landscape") {
          const pixelPitchW = surfaceW / nativeW;
          projectorOutputW = surfaceW;
          projectorOutputH = nativeH * pixelPitchW;
        } else {
          // Portrait: projector is rotated 90 degrees
          const pixelPitchW = surfaceW / nativeH;
          projectorOutputW = surfaceW;
          projectorOutputH = nativeW * pixelPitchW;
        }
      } else {
        // Scale to Height: Fit height perfectly, width may overflow/underflow
        if (projectorOrientation === "landscape") {
          const pixelPitchH = surfaceH / nativeH;
          projectorOutputW = nativeW * pixelPitchH;
          projectorOutputH = surfaceH;
        } else {
          // Portrait: projector is rotated 90 degrees
          const pixelPitchH = surfaceH / nativeW;
          projectorOutputW = nativeH * pixelPitchH;
          projectorOutputH = surfaceH;
        }
      }
    }

    // Clear canvas with light gray background
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate scale to fit both rectangles
    // For blended mode, account for total coverage width
    let totalProjectorWidth = projectorOutputW;
    if (projectorMode === "blended" && projectorCount > 1) {
      const overlapDecimal = blendOverlap / 100;
      totalProjectorWidth =
        projectorOutputW * projectorCount -
        projectorOutputW *
        overlapDecimal *
        (projectorCount - 1);
    }
    const maxWidth = Math.max(totalProjectorWidth, surfaceW);
    const maxHeight = Math.max(projectorOutputH, surfaceH);
    const scaleX = (canvasWidth - padding * 2) / maxWidth;
    const scaleY = (canvasHeight - padding * 2) / maxHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate scaled dimensions
    const scaledSurfaceW = surfaceW * scale;
    const scaledSurfaceH = surfaceH * scale;
    const scaledProjectorW = projectorOutputW * scale;
    const scaledProjectorH = projectorOutputH * scale;

    // Center position
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Draw projector output(s) (RED) - centered
    const projectorX = centerX - scaledProjectorW / 2;
    const projectorY = centerY - scaledProjectorH / 2;

    if (projectorMode === "blended" && projectorCount > 1) {
      // Draw multiple projectors with overlap visualization
      // Each projector is already calculated with correct aspect ratio in projectorOutputW/H
      const overlapDecimal = blendOverlap / 100;
      const scaledIndividualW = projectorOutputW * scale;
      const scaledIndividualH = projectorOutputH * scale;

      // Calculate overlap dimensions
      const overlapWidth = projectorOutputW * overlapDecimal;
      const scaledOverlapW = overlapWidth * scale;
      const nonOverlapWidth = projectorOutputW - overlapWidth;

      // Calculate total coverage width
      const totalCoverageW =
        projectorOutputW * projectorCount -
        overlapWidth * (projectorCount - 1);

      // Starting position (left-most projector)
      const startX = centerX - (totalCoverageW * scale) / 2;
      const startY = centerY - scaledIndividualH / 2;

      // Draw each projector
      for (let i = 0; i < projectorCount; i++) {
        const xOffset = i * nonOverlapWidth * scale;
        const thisProjectorX = startX + xOffset;

        // Draw projector rectangle
        ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
        ctx.fillRect(
          thisProjectorX,
          startY,
          scaledIndividualW,
          scaledIndividualH,
        );
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          thisProjectorX,
          startY,
          scaledIndividualW,
          scaledIndividualH,
        );

        // Draw overlap zone with hatching (except for the last projector)
        if (i < projectorCount - 1) {
          const overlapX =
            thisProjectorX + scaledIndividualW - scaledOverlapW;

          // Draw hatch pattern for overlap
          ctx.save();
          ctx.strokeStyle = "#dc2626";
          ctx.lineWidth = 2;
          ctx.setLineDash([]);

          // Create clipping region for hatching
          ctx.beginPath();
          ctx.rect(
            overlapX,
            startY,
            scaledOverlapW,
            scaledIndividualH,
          );
          ctx.clip();

          // Draw diagonal lines
          const spacing = 10;
          for (
            let h = -scaledIndividualH;
            h < scaledOverlapW + scaledIndividualH;
            h += spacing
          ) {
            ctx.beginPath();
            ctx.moveTo(overlapX + h, startY);
            ctx.lineTo(
              overlapX + h - scaledIndividualH,
              startY + scaledIndividualH,
            );
            ctx.stroke();
          }

          ctx.restore();

          // Draw overlap zone border
          ctx.strokeStyle = "#dc2626";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            overlapX,
            startY,
            scaledOverlapW,
            scaledIndividualH,
          );
          ctx.setLineDash([]);

          // Add overlap percentage text in the center of overlap zone
          ctx.fillStyle = "#dc2626";
          ctx.font = "bold 13px system-ui";
          ctx.textAlign = "center";
          ctx.fillText(
            `${blendOverlap}%`,
            overlapX + scaledOverlapW / 2,
            startY + scaledIndividualH / 2 + 5,
          );
        }

        // Label each projector
        ctx.fillStyle = "#ef4444";
        ctx.font = "11px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(
          `Proj ${i + 1}`,
          thisProjectorX + scaledIndividualW / 2,
          startY - 5,
        );
      }
    } else {
      // Single projector or stacked (draw as one rectangle)
      ctx.fillStyle = "rgba(239, 68, 68, 0.3)";
      ctx.fillRect(
        projectorX,
        projectorY,
        scaledProjectorW,
        scaledProjectorH,
      );
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        projectorX,
        projectorY,
        scaledProjectorW,
        scaledProjectorH,
      );
    }

    // Draw surface (BLUE) - centered
    const surfaceX = centerX - scaledSurfaceW / 2;
    const surfaceY = centerY - scaledSurfaceH / 2;
    ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
    ctx.fillRect(
      surfaceX,
      surfaceY,
      scaledSurfaceW,
      scaledSurfaceH,
    );
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      surfaceX,
      surfaceY,
      scaledSurfaceW,
      scaledSurfaceH,
    );

    // Labels
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";

    // Projector label (RED) - include native resolution (swap if portrait)
    ctx.fillStyle = "#ef4444";
    const displayNativeW =
      projectorOrientation === "portrait" ? nativeH : nativeW;
    const displayNativeH =
      projectorOrientation === "portrait" ? nativeW : nativeH;
    const projectorLabel =
      projectorMode === "blended" && projectorCount > 1
        ? `${projectorCount}x Projector Output (${displayNativeW} × ${displayNativeH} px each)`
        : projectorMode === "stacked" && projectorCount > 1
          ? `${projectorCount}x Projector Output (${displayNativeW} × ${displayNativeH} px, Stacked)`
          : `Projector Output (${displayNativeW} × ${displayNativeH} px)`;

    // Calculate label positions to avoid overlap
    const projectorLabelY = projectorY - 30;
    const surfaceLabelY = surfaceY + 30; // Position inside the blue surface area at the top

    ctx.fillText(projectorLabel, centerX, projectorLabelY);

    // Surface label (BLUE) - calculate pixel resolution based on surface aspect ratio
    ctx.fillStyle = "#3b82f6";

    // Calculate Surface/Canvas resolution (what you design your content at)
    // This matches the calculation in the top card (lines 3360-3380)
    let surfacePixelW, surfacePixelH;

    if (blendScaleMode === "width") {
      // Scale to Width: width = native, height scales proportionally
      surfacePixelW = nativeW;
      surfacePixelH = Math.round(
        (surfaceH / surfaceW) * nativeW,
      );
    } else {
      // Scale to Height: height = native, width scales proportionally
      surfacePixelH = nativeH;
      surfacePixelW = Math.round(
        (surfaceW / surfaceH) * nativeH,
      );
    }

    ctx.fillText(
      `Surface / Canvas (${surfacePixelW} × ${surfacePixelH} px)`,
      centerX,
      surfaceLabelY,
    );
  }, [
    activeTab,
    measurementWidth,
    measurementHeight,
    projectorOrientation,
    projectorNativeWidth,
    projectorNativeHeight,
    throwRatio,
    unit,
    pixelWidth,
    pixelHeight,
    projectorMode,
    projectorCount,
    blendOverlap,
    blendScaleMode,
  ]);

  // Download test pattern
  const downloadTestPattern = async () => {
    const pxW = parseInt(pixelWidth);
    const pxH = parseInt(pixelHeight);

    if (isNaN(pxW) || isNaN(pxH) || pxW <= 0 || pxH <= 0) {
      alert("Please enter valid resolution dimensions");
      return;
    }

    // Create off-screen canvas for test pattern at full resolution
    const canvas = document.createElement("canvas");
    canvas.width = pxW;
    canvas.height = pxH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background and pattern colors based on mode
    const bgColor =
      patternMode === "light" ? "#e8e8e8" : "#1a1a1a";
    const gridPrimaryColor =
      patternMode === "light" ? "#ff0000" : "#ff0000";
    const gridSecondaryColor =
      patternMode === "light" ? "#888888" : "#404040";
    const textColor =
      patternMode === "light" ? "#000000" : "#ffffff";
    const circleColor =
      patternMode === "light" ? "#000000" : "#ffffff";

    // Clear canvas with background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, pxW, pxH);

    // Draw fine grid lines (light gray/dark gray)
    ctx.strokeStyle = gridSecondaryColor;
    ctx.lineWidth = Math.max(1, pxW / 1200); // Scale line width
    const fineGridSpacingH = pxW / 32;
    const fineGridSpacingV = pxH / 18;

    for (let i = 0; i <= 32; i++) {
      ctx.beginPath();
      ctx.moveTo(i * fineGridSpacingH, 0);
      ctx.lineTo(i * fineGridSpacingH, pxH);
      ctx.stroke();
    }

    for (let i = 0; i <= 18; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * fineGridSpacingV);
      ctx.lineTo(pxW, i * fineGridSpacingV);
      ctx.stroke();
    }

    // Draw major grid lines (red, thicker)
    ctx.strokeStyle = gridPrimaryColor;
    ctx.lineWidth = Math.max(2, pxW / 600); // Scale line width
    const majorGridSpacingH = pxW / 4;
    const majorGridSpacingV = pxH / 3;

    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * majorGridSpacingH, 0);
      ctx.lineTo(i * majorGridSpacingH, pxH);
      ctx.stroke();
    }

    for (let i = 0; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * majorGridSpacingV);
      ctx.lineTo(pxW, i * majorGridSpacingV);
      ctx.stroke();
    }

    // Center circle
    const centerX = pxW / 2;
    const centerY = pxH / 2;
    const centerRadius = Math.min(pxW, pxH) * 0.35;

    ctx.strokeStyle = circleColor;
    ctx.lineWidth = Math.max(2, pxW / 600);
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Color bars in center
    const colorBarHeight = pxH * 0.08;
    const colorBarY = centerY - colorBarHeight / 2;
    const colors = [
      "#FFFFFF",
      "#FFFF00",
      "#00FFFF",
      "#00FF00",
      "#FF00FF",
      "#FF0000",
      "#0000FF",
      "#000000",
    ];
    const colorBarWidth = (pxW * 0.5) / colors.length;
    const colorBarsStartX = centerX - pxW * 0.25;

    colors.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        colorBarsStartX + index * colorBarWidth,
        colorBarY,
        colorBarWidth,
        colorBarHeight,
      );
    });

    // Text in center
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Test pattern name
    const nameFontSize = Math.min(pxW, pxH) * 0.06;
    ctx.font = `${nameFontSize}px sans-serif`;
    ctx.fillText(
      testPatternName || "Test Pattern",
      centerX,
      centerY - pxH * 0.15,
    );

    // Resolution
    const resFontSize = Math.min(pxW, pxH) * 0.055;
    ctx.font = `${resFontSize}px sans-serif`;
    ctx.fillText(
      `${pxW}px × ${pxH}px`,
      centerX,
      centerY - pxH * 0.08,
    );

    // Additional info
    const infoFontSize = Math.min(pxW, pxH) * 0.03;
    ctx.font = `${infoFontSize}px sans-serif`;
    const aspectRatio = getAspectRatio();
    const pixelPitch = getPixelPitch();
    const surfaceWidth = parseFloat(measurementWidth);
    const surfaceHeight = parseFloat(measurementHeight);

    ctx.fillText(
      `Aspect Ratio: ${aspectRatio} (${(surfaceWidth / surfaceHeight).toFixed(2)}:1)`,
      centerX,
      centerY + pxH * 0.1,
    );
    ctx.fillText(
      `Pixel Pitch: ${pixelPitch.mm} mm`,
      centerX,
      centerY + pxH * 0.14,
    );
    const unitLabel = getUnitLabel();
    const diagonal = getDiagonalSize();
    ctx.fillText(
      `Surface Dimension: ${surfaceWidth.toFixed(1)}${unitLabel} x ${surfaceHeight.toFixed(1)}${unitLabel} (${diagonal}${unitLabel} diagonal)`,
      centerX,
      centerY + pxH * 0.18,
    );

    // Download or Share
    const fileName = `${testPatternName || "test-pattern"}_${pxW}x${pxH}.png`;

    if (Capacitor.isNativePlatform()) {
      // On iOS/Android, use Share with image data for "Save Image" option
      const dataUrl = canvas.toDataURL("image/png");
      const base64Data = dataUrl.split(",")[1];

      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          files: [result.uri],
        });
      } catch (err) {
        // User cancelled share - not an error
        console.log("Share cancelled or failed:", err);
      }
    } else {
      // On web, use traditional download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  const getThrowDistance = (): string => {
    const nativeW = parseFloat(projectorNativeWidth) || 1920;
    const nativeH = parseFloat(projectorNativeHeight) || 1080;
    const aspectRatio = nativeW / nativeH;
    const ratio = parseFloat(throwRatio);
    const width = parseFloat(measurementWidth);

    if (isNaN(ratio) || isNaN(width)) {
      return "0.00 " + getUnitLabel();
    }

    // Calculate individual projector width for blended mode
    let effectiveWidth = width;
    if (projectorMode === "blended" && projectorCount > 1) {
      const overlapDecimal = blendOverlap / 100;
      effectiveWidth =
        (width * (1 + (projectorCount - 1) * overlapDecimal)) /
        projectorCount;
    }

    const distance =
      projectorOrientation === "landscape"
        ? ratio * effectiveWidth
        : ratio * effectiveWidth * aspectRatio;

    return `${distance.toFixed(2)} ${getUnitLabel()}`;
  };

  // Aspect Ratio Estimator Functions
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEstimatorImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      // Use Capacitor Camera plugin on native platforms
      if (Capacitor.isNativePlatform()) {
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });

        if (image.dataUrl) {
          setEstimatorImage(image.dataUrl);
        }
        return;
      }

      // Fallback to web API for browser
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        alert(
          "Camera access is not supported in your browser. Please use the Upload Photo option instead.",
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);

      let errorMessage = "Unable to access camera. ";

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        errorMessage +=
          "Camera permission was denied. Please check your browser settings and allow camera access for this site.";
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        errorMessage +=
          "No camera device found. Please ensure your device has a camera.";
      } else if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError"
      ) {
        errorMessage +=
          "Camera is already in use by another application.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage +=
          "Camera constraints could not be satisfied.";
      } else if (err.name === "SecurityError") {
        errorMessage +=
          "Camera access is only available on secure (HTTPS) connections.";
      } else {
        errorMessage +=
          "Please try using the Upload Photo option instead.";
      }

      alert(errorMessage);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setEstimatorImage(canvas.toDataURL("image/jpeg"));
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const clearEstimatorImage = () => {
    setEstimatorImage(null);
    // Reset rectangle to default position
    setRectangleCorners({
      topLeft: { x: 100, y: 100 },
      topRight: { x: 400, y: 100 },
      bottomRight: { x: 400, y: 300 },
      bottomLeft: { x: 100, y: 300 },
    });
  };

  const applyEstimatedAspectRatio = () => {
    // Use perspective-corrected distances instead of simple pixel distances
    const { topLeft, topRight, bottomRight, bottomLeft } =
      rectangleCorners;

    // Calculate distances between all corners using Euclidean distance
    const topWidth = Math.sqrt(
      Math.pow(topRight.x - topLeft.x, 2) +
      Math.pow(topRight.y - topLeft.y, 2),
    );
    const bottomWidth = Math.sqrt(
      Math.pow(bottomRight.x - bottomLeft.x, 2) +
      Math.pow(bottomRight.y - bottomLeft.y, 2),
    );
    const leftHeight = Math.sqrt(
      Math.pow(bottomLeft.x - topLeft.x, 2) +
      Math.pow(bottomLeft.y - topLeft.y, 2),
    );
    const rightHeight = Math.sqrt(
      Math.pow(bottomRight.x - topRight.x, 2) +
      Math.pow(bottomRight.y - topRight.y, 2),
    );

    // Average the parallel sides to account for perspective
    const avgWidth = (topWidth + bottomWidth) / 2;
    const avgHeight = (leftHeight + rightHeight) / 2;

    const ratio = avgWidth / avgHeight;

    // Apply to measurement height based on current width
    const currentWidth = parseFloat(measurementWidth) || 16;
    const newHeight = currentWidth / ratio;

    setMeasurementHeight(newHeight.toFixed(2));

    if (unit === "feet") {
      setHeightFeet(Math.floor(newHeight).toString());
      setHeightInches(((newHeight % 1) * 12).toFixed(0));
    }

    // Mark that aspect ratio has been applied
    setAspectRatioApplied(true);
  };

  // Draw estimator canvas
  useEffect(() => {
    const canvas = estimatorCanvasRef.current;
    if (!canvas || !estimatorImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to match container
      const maxWidth = 600;
      const maxHeight = 400;
      const scale = Math.min(
        maxWidth / img.width,
        maxHeight / img.height,
        1,
      );

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Initialize rectangle position if this is first load
      if (
        rectangleCorners.topLeft.x === 100 &&
        rectangleCorners.topLeft.y === 100
      ) {
        const padding = 50;
        setRectangleCorners({
          topLeft: { x: padding, y: padding },
          topRight: { x: canvas.width - padding, y: padding },
          bottomRight: {
            x: canvas.width - padding,
            y: canvas.height - padding,
          },
          bottomLeft: {
            x: padding,
            y: canvas.height - padding,
          },
        });
      }

      // Draw rectangle
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(
        rectangleCorners.topLeft.x,
        rectangleCorners.topLeft.y,
      );
      ctx.lineTo(
        rectangleCorners.topRight.x,
        rectangleCorners.topRight.y,
      );
      ctx.lineTo(
        rectangleCorners.bottomRight.x,
        rectangleCorners.bottomRight.y,
      );
      ctx.lineTo(
        rectangleCorners.bottomLeft.x,
        rectangleCorners.bottomLeft.y,
      );
      ctx.closePath();
      ctx.stroke();

      // Draw corner handles as plus signs
      const plusSize = 25; // Larger for easier touch
      Object.entries(rectangleCorners).forEach(
        ([key, corner]) => {
          ctx.strokeStyle = "#eab308"; // yellow-500
          ctx.lineWidth = 3;

          // Draw horizontal line of plus
          ctx.beginPath();
          ctx.moveTo(corner.x - plusSize, corner.y);
          ctx.lineTo(corner.x + plusSize, corner.y);
          ctx.stroke();

          // Draw vertical line of plus
          ctx.beginPath();
          ctx.moveTo(corner.x, corner.y - plusSize);
          ctx.lineTo(corner.x, corner.y + plusSize);
          ctx.stroke();
        },
      );

      // Draw dimensions
      const width = Math.abs(
        rectangleCorners.topRight.x -
        rectangleCorners.topLeft.x,
      );
      const height = Math.abs(
        rectangleCorners.bottomLeft.y -
        rectangleCorners.topLeft.y,
      );
      const ratio = width / height;

      // Draw width label on top line
      const centerX =
        (rectangleCorners.topLeft.x +
          rectangleCorners.topRight.x) /
        2;
      const topY = rectangleCorners.topLeft.y;

      // Calculate pixel width based on current measurements
      const physicalWidth = parseFloat(measurementWidth);
      const physicalHeight = parseFloat(measurementHeight);
      const pxWidth = parseInt(pixelWidth);

      if (
        !isNaN(physicalWidth) &&
        !isNaN(physicalHeight) &&
        physicalWidth > 0 &&
        physicalHeight > 0 &&
        pxWidth > 0
      ) {
        const calculatedPxWidth = pxWidth;

        // Background for text
        const surfaceText = `${physicalWidth.toFixed(2)}${getUnitLabel()}`;
        const pixelText = `${calculatedPxWidth}px`;
        const combinedText = `${surfaceText} | ${pixelText}`;

        ctx.font = "bold 14px system-ui";
        const textWidth = ctx.measureText(combinedText).width;

        ctx.fillStyle = "rgba(59, 130, 246, 0.9)"; // blue background
        ctx.fillRect(
          centerX - textWidth / 2 - 8,
          topY - 30,
          textWidth + 16,
          22,
        );

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(combinedText, centerX, topY - 19);

        // Reset text alignment
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        // Draw height label on right side if aspect ratio has been applied
        if (aspectRatioApplied) {
          const pxHeight = parseInt(pixelHeight);
          if (!isNaN(pxHeight) && pxHeight > 0) {
            const centerY =
              (rectangleCorners.topRight.y +
                rectangleCorners.bottomRight.y) /
              2;
            const rightX = rectangleCorners.topRight.x;

            const heightSurfaceText = `${physicalHeight.toFixed(2)}${getUnitLabel()}`;
            const heightPixelText = `${pxHeight}px`;
            const heightCombinedText = `${heightSurfaceText} | ${heightPixelText}`;

            ctx.font = "bold 14px system-ui";
            const heightTextWidth = ctx.measureText(
              heightCombinedText,
            ).width;

            // Determine if label should be inside or outside based on rectangle width
            const rectWidth =
              rectangleCorners.topRight.x -
              rectangleCorners.topLeft.x;
            const putInside = rectWidth > 120; // If rectangle is wider than 120px, put label inside

            let labelX;
            if (putInside) {
              // Inside: position to the left of the right edge
              labelX = rightX - heightTextWidth - 31;
            } else {
              // Outside: position to the right of the right edge
              labelX = rightX + 15;
            }

            // Draw background
            ctx.fillStyle = "rgba(59, 130, 246, 0.9)"; // blue background
            ctx.fillRect(
              labelX,
              centerY - 11,
              heightTextWidth + 16,
              22,
            );

            // Draw text
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(
              heightCombinedText,
              labelX + 8,
              centerY,
            );

            // Reset text alignment
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
          }
        }
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 10, 180, 50);
      ctx.fillStyle = "#ffffff";
      ctx.font = "14px system-ui";
      ctx.fillText(
        `Aspect Ratio: ${ratio.toFixed(3)}:1`,
        20,
        30,
      );
      ctx.fillText(`≈ ${Math.round(ratio * 10)}:${10}`, 20, 50);

      // Draw reference rectangle if enabled
      if (showReferenceRect) {
        const ratio = aspectRatios[selectedAspectRatio];
        const refHeight = referenceRect.width / ratio;

        // Draw semi-transparent blue rectangle
        ctx.fillStyle = "rgba(59, 130, 246, 0.5)"; // blue-500 at 50% opacity
        ctx.fillRect(
          referenceRect.x,
          referenceRect.y,
          referenceRect.width,
          refHeight,
        );

        // Draw border
        ctx.strokeStyle = "#3b82f6"; // blue-500
        ctx.lineWidth = 2;
        ctx.strokeRect(
          referenceRect.x,
          referenceRect.y,
          referenceRect.width,
          refHeight,
        );

        // Draw label in center
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          selectedAspectRatio,
          referenceRect.x + referenceRect.width / 2,
          referenceRect.y + refHeight / 2,
        );

        // Draw resize handle at bottom-right corner
        const handleSize = 30; // Larger for touch
        const handleX = referenceRect.x + referenceRect.width;
        const handleY = referenceRect.y + refHeight;

        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(
          handleX - handleSize,
          handleY - handleSize,
          handleSize,
          handleSize,
        );
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          handleX - handleSize,
          handleY - handleSize,
          handleSize,
          handleSize,
        );

        // Reset text alignment
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      }

      // Draw circular magnifier if dragging a corner
      if (magnifierPos && draggingCorner) {
        const magnifierRadius = 100; // Larger magnifier
        const zoomFactor = 3;
        const corner =
          rectangleCorners[
          draggingCorner as keyof typeof rectangleCorners
          ];

        // Draw magnified area
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          magnifierPos.x,
          magnifierPos.y,
          magnifierRadius,
          0,
          Math.PI * 2,
        );
        ctx.clip();

        // Draw zoomed portion of the image
        const sourceSize = (magnifierRadius * 2) / zoomFactor;
        ctx.drawImage(
          img,
          (corner.x / canvas.width) * img.width -
          sourceSize / 2,
          (corner.y / canvas.height) * img.height -
          sourceSize / 2,
          sourceSize,
          sourceSize,
          magnifierPos.x - magnifierRadius,
          magnifierPos.y - magnifierRadius,
          magnifierRadius * 2,
          magnifierRadius * 2,
        );

        ctx.restore();

        // Draw the corner handle in the magnifier
        const handlePlusSize = 20;
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 3;

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(
          magnifierPos.x - handlePlusSize,
          magnifierPos.y,
        );
        ctx.lineTo(
          magnifierPos.x + handlePlusSize,
          magnifierPos.y,
        );
        ctx.stroke();

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(
          magnifierPos.x,
          magnifierPos.y - handlePlusSize,
        );
        ctx.lineTo(
          magnifierPos.x,
          magnifierPos.y + handlePlusSize,
        );
        ctx.stroke();

        // Draw magnifier border
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(
          magnifierPos.x,
          magnifierPos.y,
          magnifierRadius,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
    };
    img.src = estimatorImage;
  }, [
    estimatorImage,
    rectangleCorners,
    magnifierPos,
    draggingCorner,
    measurementWidth,
    measurementHeight,
    pixelWidth,
    pixelHeight,
    unit,
    aspectRatioApplied,
    showReferenceRect,
    referenceRect,
    selectedAspectRatio,
    aspectRatios,
  ]);

  // Constrain reference rectangle when aspect ratio changes
  useEffect(() => {
    const canvas = estimatorCanvasRef.current;
    if (!canvas || !showReferenceRect) return;

    const ratio = aspectRatios[selectedAspectRatio];
    const refHeight = referenceRect.width / ratio;

    // Check if rectangle would go off screen
    if (referenceRect.y + refHeight > canvas.height) {
      // Calculate max width that keeps rectangle on screen
      const maxHeight = canvas.height - referenceRect.y - 20; // 20px padding
      const maxWidth = maxHeight * ratio;
      setReferenceRect((prev) => ({
        ...prev,
        width: Math.max(50, maxWidth),
      }));
    }

    // Also check if width goes off screen
    if (referenceRect.x + referenceRect.width > canvas.width) {
      const maxWidth = canvas.width - referenceRect.x - 20; // 20px padding
      setReferenceRect((prev) => ({
        ...prev,
        width: Math.max(50, maxWidth),
      }));
    }
  }, [selectedAspectRatio, showReferenceRect]);

  // Export page - Draw test pattern (simplified version for export)
  useEffect(() => {
    if (activeTab !== "export") return;
    const canvas = exportTestPatternRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pxW = parseInt(pixelWidth);
    const pxH = parseInt(pixelHeight);

    if (isNaN(pxW) || isNaN(pxH) || pxW <= 0 || pxH <= 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const scale =
      Math.min(canvasWidth / pxW, canvasHeight / pxH) * 0.9;

    const scaledWidth = pxW * scale;
    const scaledHeight = pxH * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;

    const bgColor =
      patternMode === "light" ? "#e8e8e8" : "#1a1a1a";
    const gridPrimaryColor = "#ff0000";
    const gridSecondaryColor =
      patternMode === "light" ? "#888888" : "#404040";
    const textColor =
      patternMode === "light" ? "#000000" : "#ffffff";
    const circleColor =
      patternMode === "light" ? "#000000" : "#ffffff";

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.strokeStyle = gridSecondaryColor;
    ctx.lineWidth = 0.3;
    const fineGridSpacingH = scaledWidth / 32;
    const fineGridSpacingV = scaledHeight / 18;

    for (let i = 0; i <= 32; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + i * fineGridSpacingH, offsetY);
      ctx.lineTo(
        offsetX + i * fineGridSpacingH,
        offsetY + scaledHeight,
      );
      ctx.stroke();
    }

    for (let i = 0; i <= 18; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + i * fineGridSpacingV);
      ctx.lineTo(
        offsetX + scaledWidth,
        offsetY + i * fineGridSpacingV,
      );
      ctx.stroke();
    }

    ctx.strokeStyle = gridPrimaryColor;
    ctx.lineWidth = 1.5;
    const majorGridSpacingH = scaledWidth / 4;
    const majorGridSpacingV = scaledHeight / 3;

    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + i * majorGridSpacingH, offsetY);
      ctx.lineTo(
        offsetX + i * majorGridSpacingH,
        offsetY + scaledHeight,
      );
      ctx.stroke();
    }

    for (let i = 0; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + i * majorGridSpacingV);
      ctx.lineTo(
        offsetX + scaledWidth,
        offsetY + i * majorGridSpacingV,
      );
      ctx.stroke();
    }

    const centerX = offsetX + scaledWidth / 2;
    const centerY = offsetY + scaledHeight / 2;
    const centerRadius =
      Math.min(scaledWidth, scaledHeight) * 0.3;

    ctx.strokeStyle = circleColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    ctx.stroke();

    const colorBarHeight = scaledHeight * 0.08;
    const colorBarY = centerY - colorBarHeight / 2;
    const colors = [
      "#FFFFFF",
      "#FFFF00",
      "#00FFFF",
      "#00FF00",
      "#FF00FF",
      "#FF0000",
      "#0000FF",
      "#000000",
    ];
    const colorBarWidth = (scaledWidth * 0.5) / colors.length;
    const colorBarsStartX = centerX - scaledWidth * 0.25;

    colors.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        colorBarsStartX + index * colorBarWidth,
        colorBarY,
        colorBarWidth,
        colorBarHeight,
      );
    });

    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Project name
    const titleFontSize =
      Math.min(scaledWidth, scaledHeight) * 0.055;
    ctx.font = `bold ${titleFontSize}px sans-serif`;
    ctx.fillText(
      testPatternName || "Test Pattern",
      centerX,
      centerY - scaledHeight * 0.15,
    );

    // Resolution
    const resFontSize =
      Math.min(scaledWidth, scaledHeight) * 0.055;
    ctx.font = `${resFontSize}px sans-serif`;
    ctx.fillText(
      `${pxW}px × ${pxH}px`,
      centerX,
      centerY - scaledHeight * 0.08,
    );

    // Additional info
    const infoFontSize =
      Math.min(scaledWidth, scaledHeight) * 0.03;
    ctx.font = `${infoFontSize}px sans-serif`;
    const aspectRatio = getAspectRatio();
    const pixelPitch = getPixelPitch();
    const surfaceWidth = parseFloat(measurementWidth);
    const surfaceHeight = parseFloat(measurementHeight);

    ctx.fillText(
      `Aspect Ratio: ${aspectRatio} (${(surfaceWidth / surfaceHeight).toFixed(2)}:1)`,
      centerX,
      centerY + scaledHeight * 0.1,
    );
    ctx.fillText(
      `Pixel Pitch: ${pixelPitch.mm} mm`,
      centerX,
      centerY + scaledHeight * 0.14,
    );
    const unitLabel = getUnitLabel();
    const diagonal = getDiagonalSize();
    ctx.fillText(
      `Surface Dimension: ${surfaceWidth.toFixed(1)}${unitLabel} x ${surfaceHeight.toFixed(1)}${unitLabel} (${diagonal}${unitLabel} diagonal)`,
      centerX,
      centerY + scaledHeight * 0.18,
    );
  }, [
    activeTab,
    pixelWidth,
    pixelHeight,
    testPatternName,
    measurementWidth,
    measurementHeight,
    patternMode,
    unit,
  ]);

  // Export page - Capture both diagram views from the hidden projector canvas
  useEffect(() => {
    if (activeTab !== "export") return;

    const captureViews = async () => {
      const sourceCanvas = projectorCanvasRef.current;
      const topCanvas = exportTopViewRef.current;
      const sectionCanvas = exportSectionViewRef.current;

      if (!topCanvas || !sectionCanvas || !sourceCanvas) return;

      const topCtx = topCanvas.getContext("2d");
      const sectionCtx = sectionCanvas.getContext("2d");

      if (!topCtx || !sectionCtx) return;

      // Save current diagram view
      const savedView = diagramView;

      // Capture top view
      setDiagramView("plan");
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Draw source canvas to top canvas (maintain aspect ratio)
      if (sourceCanvas.width > 0 && sourceCanvas.height > 0) {
        topCtx.fillStyle = "#f8f9fa";
        topCtx.fillRect(
          0,
          0,
          topCanvas.width,
          topCanvas.height,
        );

        const scale = Math.min(
          topCanvas.width / sourceCanvas.width,
          topCanvas.height / sourceCanvas.height,
        );
        const scaledW = sourceCanvas.width * scale;
        const scaledH = sourceCanvas.height * scale;
        const x = (topCanvas.width - scaledW) / 2;
        const y = (topCanvas.height - scaledH) / 2;

        topCtx.drawImage(
          sourceCanvas,
          0,
          0,
          sourceCanvas.width,
          sourceCanvas.height,
          x,
          y,
          scaledW,
          scaledH,
        );
      }

      // Capture section view
      setDiagramView("section");
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Draw source canvas to section canvas (maintain aspect ratio)
      if (sourceCanvas.width > 0 && sourceCanvas.height > 0) {
        sectionCtx.fillStyle = "#f8f9fa";
        sectionCtx.fillRect(
          0,
          0,
          sectionCanvas.width,
          sectionCanvas.height,
        );

        const scale = Math.min(
          sectionCanvas.width / sourceCanvas.width,
          sectionCanvas.height / sourceCanvas.height,
        );
        const scaledW = sourceCanvas.width * scale;
        const scaledH = sourceCanvas.height * scale;
        const x = (sectionCanvas.width - scaledW) / 2;
        const y = (sectionCanvas.height - scaledH) / 2;

        sectionCtx.drawImage(
          sourceCanvas,
          0,
          0,
          sourceCanvas.width,
          sourceCanvas.height,
          x,
          y,
          scaledW,
          scaledH,
        );
      }

      // Restore original view
      setDiagramView(savedView);
    };

    captureViews();
  }, [
    activeTab,
    throwRatio,
    measurementWidth,
    measurementHeight,
    projectorOrientation,
    projectorNativeWidth,
    projectorNativeHeight,
    unit,
    lumens,
    screenGain,
    projectorMode,
    projectorCount,
    blendOverlap,
    blendScaleMode,
  ]);

  // Export page - Copy difference viewer from hidden resolution canvas
  useEffect(() => {
    if (activeTab !== "export") return;

    const timer = setTimeout(() => {
      const canvas = exportDifferenceRef.current;
      const sourceCanvas = differenceCanvasRef.current;

      if (!canvas || !sourceCanvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Scale and draw the source canvas to fit the export canvas (maintain aspect ratio)
      if (sourceCanvas.width > 0 && sourceCanvas.height > 0) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const scale = Math.min(
          canvas.width / sourceCanvas.width,
          canvas.height / sourceCanvas.height,
        );
        const scaledW = sourceCanvas.width * scale;
        const scaledH = sourceCanvas.height * scale;
        const x = (canvas.width - scaledW) / 2;
        const y = (canvas.height - scaledH) / 2;

        ctx.drawImage(
          sourceCanvas,
          0,
          0,
          sourceCanvas.width,
          sourceCanvas.height,
          x,
          y,
          scaledW,
          scaledH,
        );
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [
    activeTab,
    measurementWidth,
    measurementHeight,
    pixelWidth,
    pixelHeight,
    projectorMode,
    projectorCount,
    blendOverlap,
    blendScaleMode,
    projectorOrientation,
    projectorNativeWidth,
    projectorNativeHeight,
  ]);

  const handleMouseDown = (
    e: React.MouseEvent<HTMLCanvasElement>,
  ) => {
    const canvas = estimatorCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicking on reference rectangle resize handle first
    if (showReferenceRect) {
      const ratio = aspectRatios[selectedAspectRatio];
      const refHeight = referenceRect.width / ratio;
      const handleSize = 40; // Larger for touch
      const handleX = referenceRect.x + referenceRect.width;
      const handleY = referenceRect.y + refHeight;

      if (
        x >= handleX - handleSize &&
        x <= handleX + 10 &&
        y >= handleY - handleSize &&
        y <= handleY + 10
      ) {
        setDraggingReference("resize");
        setDragOffset({
          x: x - (referenceRect.x + referenceRect.width),
          y: y - (referenceRect.y + refHeight),
        });
        return;
      }

      // Check if clicking inside reference rectangle to move it
      if (
        x >= referenceRect.x &&
        x <= referenceRect.x + referenceRect.width &&
        y >= referenceRect.y &&
        y <= referenceRect.y + refHeight
      ) {
        setDraggingReference("move");
        setDragOffset({
          x: x - referenceRect.x,
          y: y - referenceRect.y,
        });
        return;
      }
    }

    // Check if clicking on a corner handle
    const handleRadius = 30; // Larger for easier selection
    let foundCorner = false;
    Object.entries(rectangleCorners).forEach(
      ([key, corner]) => {
        if (!foundCorner) {
          const distance = Math.sqrt(
            (x - corner.x) ** 2 + (y - corner.y) ** 2,
          );
          if (distance < handleRadius) {
            setDraggingCorner(key);
            foundCorner = true;
            // Set magnifier position to center of canvas
            setMagnifierPos({
              x: rect.width / 2,
              y: rect.height / 2,
            });
          }
        }
      },
    );
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLCanvasElement>,
  ) => {
    const canvas = estimatorCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Handle reference rectangle dragging
    if (draggingReference === "move") {
      const ratio = aspectRatios[selectedAspectRatio];
      const newX = Math.max(
        0,
        Math.min(
          x - dragOffset.x,
          canvas.width - referenceRect.width,
        ),
      );
      const refHeight = referenceRect.width / ratio;
      const newY = Math.max(
        0,
        Math.min(y - dragOffset.y, canvas.height - refHeight),
      );
      setReferenceRect((prev) => ({
        ...prev,
        x: newX,
        y: newY,
      }));
      return;
    }

    if (draggingReference === "resize") {
      const ratio = aspectRatios[selectedAspectRatio];
      let newWidth = Math.max(50, x - referenceRect.x);

      // Constrain width so height doesn't go off screen
      const newHeight = newWidth / ratio;
      if (referenceRect.y + newHeight > canvas.height) {
        const maxHeight = canvas.height - referenceRect.y;
        newWidth = maxHeight * ratio;
      }

      // Constrain width so it doesn't go off screen horizontally
      if (referenceRect.x + newWidth > canvas.width) {
        newWidth = canvas.width - referenceRect.x;
      }

      setReferenceRect((prev) => ({
        ...prev,
        width: Math.max(50, newWidth),
      }));
      return;
    }

    // Handle corner dragging
    if (!draggingCorner) return;

    const clampedX = Math.max(0, Math.min(x, canvas.width));
    const clampedY = Math.max(0, Math.min(y, canvas.height));

    setRectangleCorners((prev) => ({
      ...prev,
      [draggingCorner]: { x: clampedX, y: clampedY },
    }));
    // Magnifier stays centered - no position update needed
  };

  const handleMouseUp = () => {
    setDraggingCorner(null);
    setMagnifierPos(null);
    setDraggingReference(null);
  };

  // Touch event handlers for iOS/mobile support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = estimatorCanvasRef.current;
    if (!canvas || !touch) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    // Check reference rectangle
    if (showReferenceRect) {
      const ratio = aspectRatios[selectedAspectRatio];
      const refHeight = referenceRect.width / ratio;
      const handleSize = 50; // Larger for touch
      const handleX = referenceRect.x + referenceRect.width;
      const handleY = referenceRect.y + refHeight;

      if (x >= handleX - handleSize && x <= handleX + 15 && y >= handleY - handleSize && y <= handleY + 15) {
        setDraggingReference("resize");
        setDragOffset({ x: x - handleX, y: y - handleY });
        return;
      }

      if (x >= referenceRect.x && x <= referenceRect.x + referenceRect.width && y >= referenceRect.y && y <= referenceRect.y + refHeight) {
        setDraggingReference("move");
        setDragOffset({ x: x - referenceRect.x, y: y - referenceRect.y });
        return;
      }
    }

    // Check corner handles
    const handleRadius = 35; // Larger for touch
    Object.entries(rectangleCorners).forEach(([key, corner]) => {
      const distance = Math.sqrt((x - corner.x) ** 2 + (y - corner.y) ** 2);
      if (distance < handleRadius) {
        setDraggingCorner(key);
        // Center magnifier on canvas
        setMagnifierPos({ x: rect.width / 2, y: rect.height / 2 });
      }
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = estimatorCanvasRef.current;
    if (!canvas || !touch) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    // Handle reference rectangle dragging
    if (draggingReference === "move") {
      setReferenceRect(prev => ({
        ...prev,
        x: Math.max(0, Math.min(x - dragOffset.x, canvas.width - prev.width)),
        y: Math.max(0, Math.min(y - dragOffset.y, canvas.height - prev.width / aspectRatios[selectedAspectRatio])),
      }));
      return;
    }

    if (draggingReference === "resize") {
      const newWidth = Math.max(50, Math.min(x - referenceRect.x, canvas.width - referenceRect.x));
      setReferenceRect(prev => ({ ...prev, width: newWidth }));
      return;
    }

    if (!draggingCorner) return;

    const clampedX = Math.max(0, Math.min(x, canvas.width));
    const clampedY = Math.max(0, Math.min(y, canvas.height));

    setRectangleCorners(prev => ({
      ...prev,
      [draggingCorner]: { x: clampedX, y: clampedY },
    }));
    // Magnifier stays centered - no position update needed
  };

  const handleTouchEnd = () => {
    setDraggingCorner(null);
    setMagnifierPos(null);
    setDraggingReference(null);
  };

  const generatePDF = async () => {
    // Dynamic import of jsPDF
    const { default: jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: "letter",
    });

    const pageWidth = 8.5;
    const pageHeight = 11;
    const margin = 0.5;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Title
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(projectTitle || "Projection Calculator Report", margin, yPos);
    yPos += 0.2;

    // Client/Venue (if provided)
    if (clientName) {
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(clientName, margin, yPos);
      yPos += 0.15;
    }

    // Date
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      margin,
      yPos,
    );
    yPos += 0.05;
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.02);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 0.2;

    // Notes (if provided)
    if (projectNotes) {
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-600
      const splitNotes = doc.splitTextToSize(projectNotes, contentWidth);
      doc.text(splitNotes, margin, yPos);
      yPos += splitNotes.length * 0.12 + 0.1;
    }
    yPos += 0.1;

    // Grid of specs (4 columns, 2 rows = 8 boxes)
    const boxWidth = (contentWidth - 0.15) / 4; // 4 columns with gaps
    const boxHeight = 0.35;
    const gap = 0.05;

    const specs = [
      {
        label: "Surface Size",
        value: `${parseFloat(measurementWidth).toFixed(2)} × ${parseFloat(measurementHeight).toFixed(2)} ${getUnitLabel()}`,
      },
      {
        label: "Canvas Resolution",
        value: `${pixelWidth} × ${getSurfacePixelHeight()} px`,
      },
      { label: "Aspect Ratio", value: getAspectRatio() },
      {
        label: "Pixel Pitch",
        value: `${getPixelPitch().mm} mm`,
      },
      {
        label: "Throw Ratio",
        value: zoomEnabled
          ? `${throwRatioMin} - ${throwRatioMax}`
          : throwRatio,
      },
      { label: "Throw Distance", value: getThrowDistance() },
      {
        label: "Lumens / fL",
        value: `${parseFloat(lumens).toLocaleString()} / ${getFootLamberts()}`,
      },
      {
        label: "Native Resolution",
        value: `${projectorNativeWidth} × ${projectorNativeHeight} px`,
      },
    ];

    specs.forEach((spec, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = margin + col * (boxWidth + gap);
      const y = yPos + row * (boxHeight + gap);

      // Draw box background
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(x, y, boxWidth, boxHeight, "F");

      // Draw label
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(spec.label, x + 0.05, y + 0.1);

      // Draw value
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(spec.value, x + 0.05, y + 0.22);
    });

    yPos += boxHeight * 2 + gap + 0.3;

    // Add Top View (full width, high quality)
    if (exportTopViewRef.current) {
      // Check if we need a new page
      if (yPos > 9.0) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text("Top View", margin, yPos);
      yPos += 0.12;

      const topImage = exportTopViewRef.current.toDataURL(
        "image/png",
        1.0,
      );
      const imgWidth = contentWidth;
      const imgHeight =
        (exportTopViewRef.current.height /
          exportTopViewRef.current.width) *
        imgWidth;

      doc.addImage(
        topImage,
        "PNG",
        margin,
        yPos,
        imgWidth,
        imgHeight,
        undefined,
        "FAST",
      );
      yPos += imgHeight + 0.2;
    }

    // Add Section View (full width, high quality)
    if (exportSectionViewRef.current) {
      if (yPos > 9.0) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text("Section View", margin, yPos);
      yPos += 0.12;

      const sectionImage =
        exportSectionViewRef.current.toDataURL(
          "image/png",
          1.0,
        );
      const imgWidth = contentWidth;
      const imgHeight =
        (exportSectionViewRef.current.height /
          exportSectionViewRef.current.width) *
        imgWidth;

      doc.addImage(
        sectionImage,
        "PNG",
        margin,
        yPos,
        imgWidth,
        imgHeight,
        undefined,
        "FAST",
      );
      yPos += imgHeight + 0.2;
    }

    // Add Test Pattern (full width, high quality) - Start on new page
    if (exportTestPatternRef.current) {
      const testImgHeight =
        (exportTestPatternRef.current.height /
          exportTestPatternRef.current.width) *
        contentWidth;

      // Check if image will fit on current page (need imgHeight + label + margin)
      if (yPos + testImgHeight + 0.3 > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text("Test Pattern", margin, yPos);
      yPos += 0.12;

      const testPatternImage =
        exportTestPatternRef.current.toDataURL(
          "image/png",
          1.0,
        );

      doc.addImage(
        testPatternImage,
        "PNG",
        margin,
        yPos,
        contentWidth,
        testImgHeight,
        undefined,
        "FAST",
      );
      yPos += testImgHeight + 0.2;
    }

    // Add Projection vs Surface (full width, high quality)
    if (exportDifferenceRef.current) {
      const diffImgHeight =
        (exportDifferenceRef.current.height /
          exportDifferenceRef.current.width) *
        contentWidth;

      // Check if image will fit on current page
      if (yPos + diffImgHeight + 0.3 > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text("Projection vs Surface", margin, yPos);
      yPos += 0.12;

      const diffImage = exportDifferenceRef.current.toDataURL(
        "image/png",
        1.0,
      );

      doc.addImage(
        diffImage,
        "PNG",
        margin,
        yPos,
        contentWidth,
        diffImgHeight,
        undefined,
        "FAST",
      );
      yPos += diffImgHeight + 0.2;
    }

    // Save the PDF
    const pdfFileName = `projection-calculator-report-${new Date().toISOString().split("T")[0]}.pdf`;

    if (Capacitor.isNativePlatform()) {
      // On iOS/Android, use Share
      const pdfBase64 = doc.output("datauristring").split(",")[1];

      try {
        const result = await Filesystem.writeFile({
          path: pdfFileName,
          data: pdfBase64,
          directory: Directory.Cache,
        });

        await Share.share({
          files: [result.uri],
        });
      } catch (err) {
        // User cancelled share - not an error
        console.log("Share cancelled or failed:", err);
      }
    } else {
      // On web, use traditional download
      doc.save(pdfFileName);
    }
  };

  // Generate Throw Distance PDF with top view, section view, and projection vs surface
  const generateThrowPDF = async () => {
    const { default: jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: "letter",
    });

    const pageWidth = 8.5;
    const pageHeight = 11;
    const margin = 0.5;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Title
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(projectTitle || "Throw Distance Calculator Report", margin, yPos);
    yPos += 0.2;

    if (clientName) {
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(clientName, margin, yPos);
      yPos += 0.15;
    }

    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 0.05;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.02);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 0.2;

    if (projectNotes) {
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const splitNotes = doc.splitTextToSize(projectNotes, contentWidth);
      doc.text(splitNotes, margin, yPos);
      yPos += splitNotes.length * 0.12 + 0.1;
    }
    yPos += 0.1;

    // Specs grid
    const boxWidth = (contentWidth - 0.15) / 4;
    const boxHeight = 0.35;
    const gap = 0.05;

    const specs = [
      { label: "Surface Size", value: `${parseFloat(measurementWidth).toFixed(2)} × ${parseFloat(measurementHeight).toFixed(2)} ${getUnitLabel()}` },
      { label: "Throw Ratio", value: zoomEnabled ? `${throwRatioMin} - ${throwRatioMax}` : throwRatio },
      { label: "Throw Distance", value: getThrowDistance() },
      { label: "Lumens / fL", value: `${parseFloat(lumens).toLocaleString()} / ${getFootLamberts()}` },
      { label: "Native Resolution", value: `${projectorNativeWidth} × ${projectorNativeHeight} px` },
      { label: "Aspect Ratio", value: getAspectRatio() },
      { label: "Screen Gain", value: screenGain },
      { label: "Mode", value: projectorMode === "single" ? "Single" : projectorMode === "stacked" ? `Stacked (${projectorCount})` : `Blended (${projectorCount})` },
    ];

    specs.forEach((spec, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = margin + col * (boxWidth + gap);
      const y = yPos + row * (boxHeight + gap);
      doc.setFillColor(248, 250, 252);
      doc.rect(x, y, boxWidth, boxHeight, "F");
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105);
      doc.text(spec.label, x + 0.05, y + 0.1);
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(spec.value, x + 0.05, y + 0.22);
    });

    yPos += boxHeight * 2 + gap + 0.3;

    // Capture Top View
    if (projectorCanvasRef.current) {
      const savedView = diagramView;
      setDiagramView("plan");
      await new Promise((resolve) => setTimeout(resolve, 150));

      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text("Top View", margin, yPos);
      yPos += 0.12;

      const topImage = projectorCanvasRef.current.toDataURL("image/png", 1.0);
      const canvasAspect = projectorCanvasRef.current.width / projectorCanvasRef.current.height;
      const maxHeight = 2.5;
      let topImgWidth = contentWidth;
      let topImgHeight = topImgWidth / canvasAspect;
      // If height exceeds max, scale down width proportionally
      if (topImgHeight > maxHeight) {
        topImgHeight = maxHeight;
        topImgWidth = maxHeight * canvasAspect;
      }
      doc.addImage(topImage, "PNG", margin, yPos, topImgWidth, topImgHeight, undefined, "FAST");
      yPos += topImgHeight + 0.2;

      // Capture Section View
      setDiagramView("section");
      await new Promise((resolve) => setTimeout(resolve, 150));

      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text("Section View", margin, yPos);
      yPos += 0.12;

      const sectionImage = projectorCanvasRef.current.toDataURL("image/png", 1.0);
      const sectionAspect = projectorCanvasRef.current.width / projectorCanvasRef.current.height;
      let sectionImgWidth = contentWidth;
      let sectionImgHeight = sectionImgWidth / sectionAspect;
      if (sectionImgHeight > maxHeight) {
        sectionImgHeight = maxHeight;
        sectionImgWidth = maxHeight * sectionAspect;
      }
      doc.addImage(sectionImage, "PNG", margin, yPos, sectionImgWidth, sectionImgHeight, undefined, "FAST");
      yPos += sectionImgHeight + 0.2;

      setDiagramView(savedView);
    }

    // Capture Projection vs Surface
    if (differenceCanvasRef.current && differenceCanvasRef.current.width > 0) {
      if (yPos > 9.0) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text("Projection vs Surface", margin, yPos);
      yPos += 0.12;

      const diffImage = differenceCanvasRef.current.toDataURL("image/png", 1.0);
      const diffAspect = differenceCanvasRef.current.width / differenceCanvasRef.current.height;
      const diffMaxHeight = 2.5;
      let diffImgWidth = contentWidth;
      let diffImgHeight = diffImgWidth / diffAspect;
      if (diffImgHeight > diffMaxHeight) {
        diffImgHeight = diffMaxHeight;
        diffImgWidth = diffMaxHeight * diffAspect;
      }
      doc.addImage(diffImage, "PNG", margin, yPos, diffImgWidth, diffImgHeight, undefined, "FAST");
    }

    const pdfFileName = `throw-distance-report-${new Date().toISOString().split("T")[0]}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output("datauristring").split(",")[1];
      try {
        const result = await Filesystem.writeFile({ path: pdfFileName, data: pdfBase64, directory: Directory.Cache });
        await Share.share({ files: [result.uri] });
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    } else {
      doc.save(pdfFileName);
    }
  };

  // Generate Resolution PDF with test pattern
  const generateResolutionPDF = async () => {
    const { default: jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: "letter",
    });

    const pageWidth = 8.5;
    const margin = 0.5;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Title
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(projectTitle || "Surface Resolution Calculator Report", margin, yPos);
    yPos += 0.2;

    if (clientName) {
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(clientName, margin, yPos);
      yPos += 0.15;
    }

    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 0.05;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.02);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 0.3;

    // Specs grid
    const boxWidth = (contentWidth - 0.15) / 4;
    const boxHeight = 0.35;
    const gap = 0.05;

    const specs = [
      { label: "Surface Size", value: `${parseFloat(measurementWidth).toFixed(2)} × ${parseFloat(measurementHeight).toFixed(2)} ${getUnitLabel()}` },
      { label: "Canvas Resolution", value: `${pixelWidth} × ${getSurfacePixelHeight()} px` },
      { label: "Aspect Ratio", value: getAspectRatio() },
      { label: "Pixel Pitch", value: `${getPixelPitch().mm} mm` },
    ];

    specs.forEach((spec, index) => {
      const col = index % 4;
      const x = margin + col * (boxWidth + gap);
      const y = yPos;
      doc.setFillColor(248, 250, 252);
      doc.rect(x, y, boxWidth, boxHeight, "F");
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105);
      doc.text(spec.label, x + 0.05, y + 0.1);
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(spec.value, x + 0.05, y + 0.22);
    });

    yPos += boxHeight + 0.3;

    // Capture Test Pattern
    if (canvasRef.current && canvasRef.current.width > 0) {
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text("Test Pattern", margin, yPos);
      yPos += 0.12;

      const testImage = canvasRef.current.toDataURL("image/png", 1.0);
      const imgHeight = (canvasRef.current.height / canvasRef.current.width) * contentWidth;
      doc.addImage(testImage, "PNG", margin, yPos, contentWidth, imgHeight, undefined, "FAST");
    }

    const pdfFileName = `resolution-report-${new Date().toISOString().split("T")[0]}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output("datauristring").split(",")[1];
      try {
        const result = await Filesystem.writeFile({ path: pdfFileName, data: pdfBase64, directory: Directory.Cache });
        await Share.share({ files: [result.uri] });
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    } else {
      doc.save(pdfFileName);
    }
  };

  // Generate Aspect Ratio PDF with annotated image
  const generateAspectPDF = async () => {
    const { default: jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: "letter",
    });

    const pageWidth = 8.5;
    const margin = 0.5;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Title
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(projectTitle || "Aspect Ratio Estimator Report", margin, yPos);
    yPos += 0.2;

    if (clientName) {
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(clientName, margin, yPos);
      yPos += 0.15;
    }

    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 0.05;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.02);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 0.3;

    // Specs
    const boxWidth = (contentWidth - 0.1) / 3;
    const boxHeight = 0.35;
    const gap = 0.05;

    const specs = [
      { label: "Selected Aspect Ratio", value: selectedAspectRatio },
      { label: "Reference Rectangle", value: showReferenceRect ? "Visible" : "Hidden" },
      { label: "Estimated Dimensions", value: estimatorImage ? "From Photo" : "No Image" },
    ];

    specs.forEach((spec, index) => {
      const x = margin + index * (boxWidth + gap);
      const y = yPos;
      doc.setFillColor(248, 250, 252);
      doc.rect(x, y, boxWidth, boxHeight, "F");
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105);
      doc.text(spec.label, x + 0.05, y + 0.1);
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(spec.value, x + 0.05, y + 0.22);
    });

    yPos += boxHeight + 0.3;

    // Capture Estimator Canvas with annotations
    if (estimatorCanvasRef.current && estimatorCanvasRef.current.width > 0 && estimatorImage) {
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text("Aspect Ratio Analysis", margin, yPos);
      yPos += 0.12;

      const estimatorImageData = estimatorCanvasRef.current.toDataURL("image/png", 1.0);
      const imgHeight = (estimatorCanvasRef.current.height / estimatorCanvasRef.current.width) * contentWidth;
      doc.addImage(estimatorImageData, "PNG", margin, yPos, contentWidth, imgHeight, undefined, "FAST");
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("No image loaded. Upload or capture an image to analyze.", margin, yPos + 1);
    }

    const pdfFileName = `aspect-ratio-report-${new Date().toISOString().split("T")[0]}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output("datauristring").split(",")[1];
      try {
        const result = await Filesystem.writeFile({ path: pdfFileName, data: pdfBase64, directory: Directory.Cache });
        await Share.share({ files: [result.uri] });
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    } else {
      doc.save(pdfFileName);
    }
  };

  // Generate CAD PDF export with projection info
  const generateCadPDF = async () => {
    if (!cadCanvasRef.current || !cadOverlayRef.current) return;

    const { default: jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "in",
      format: "letter",
    });

    const pageWidth = 11;
    const pageHeight = 8.5;
    const margin = 0.5;
    let yPos = margin;

    // Title
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("CAD Projection Layout", margin, yPos);
    yPos += 0.25;

    // Date
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 0.15;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.01);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 0.2;

    // Calculate and display specs for ALL projectors
    const feetPerInch = cadScaleMode === "architect"
      ? 1 / (architectScales[cadScale] || 0.25)
      : parseFloat(cadCustomScale);

    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    // Loop through all projectors and display their specs
    cadProjectors.forEach((projector: { id: number; sectionPos: { x: number; y: number }; screenSectionPos: { x: number; y: number }; throwRatio: number; lumens: string; lensShiftV: number; aspectRatio: string; brand: string; model: string }) => {
      // Use SECTION VIEW positions for throw distance (matches Projection Info Section View)
      const dx = projector.screenSectionPos.x - projector.sectionPos.x;
      const dy = projector.screenSectionPos.y - projector.sectionPos.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const throwDistFeet = (distPx / 108) * feetPerInch;

      // Calculate image dimensions based on throw ratio and aspect ratio
      const imageWidthFeet = throwDistFeet / projector.throwRatio;
      const aspectRatioValue = projector.aspectRatio === "16:10" ? 16 / 10 : projector.aspectRatio === "4:3" ? 4 / 3 : 16 / 9;
      const imageHeightFeet = imageWidthFeet / aspectRatioValue;
      const area = imageWidthFeet * imageHeightFeet;
      const fl = parseFloat(projector.lumens) / area;

      // Calculate hanging height if floor is set
      let hangingHeightStr = "";
      if (cadFloorZ !== null) {
        const projX = projector.sectionPos.x;
        const projY = projector.sectionPos.y;
        const floorX = cadFloorZ.x;
        const floorY = cadFloorZ.y;

        // Convert to positions relative to PDF center
        const projRelX = projX - cadPdfSize.width / 2;
        const projRelY = projY - cadPdfSize.height / 2;
        const floorRelX = floorX - cadPdfSize.width / 2;
        const floorRelY = floorY - cadPdfSize.height / 2;

        // Apply rotation to get view-space positions
        const radians = (cadRotation * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const projViewY = projRelX * sin + projRelY * cos;
        const floorViewY = floorRelX * sin + floorRelY * cos;

        const heightPx = floorViewY - projViewY;
        const heightFeet = (heightPx / 108) * feetPerInch;
        hangingHeightStr = `  |  Height: ${heightFeet.toFixed(2)} ft`;
      }

      // Build projector label
      let projectorLabel = `Projector ${projector.id}`;
      if (projector.brand || projector.model) {
        projectorLabel += ` (${projector.brand} ${projector.model})`.trim();
      }
      projectorLabel += ": ";

      const specs = [
        `Throw: ${throwDistFeet.toFixed(2)} ft`,
        `Ratio: ${projector.throwRatio.toFixed(2)}:1`,
        `Image: ${imageWidthFeet.toFixed(2)} ft`,
        `Brightness: ${fl.toFixed(1)} fL`,
        `Lumens: ${projector.lumens}`,
        `V-Shift: ${projector.lensShiftV}%`,
      ];

      doc.text(projectorLabel + specs.join("  |  ") + hangingHeightStr, margin, yPos);
      yPos += 0.18;
    });

    yPos += 0.1;

    // Combine PDF and overlay canvases
    const pdfCanvas = cadCanvasRef.current;
    const overlay = cadOverlayRef.current;

    // Create combined canvas
    const combinedCanvas = document.createElement("canvas");
    combinedCanvas.width = pdfCanvas.width;
    combinedCanvas.height = pdfCanvas.height;
    const ctx = combinedCanvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(pdfCanvas, 0, 0);
      ctx.drawImage(overlay, 0, 0);
    }

    // Add combined image to PDF
    const imgData = combinedCanvas.toDataURL("image/png");
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (combinedCanvas.height / combinedCanvas.width) * imgWidth;
    const maxImgHeight = pageHeight - yPos - margin;

    const finalImgWidth = imgHeight > maxImgHeight
      ? (maxImgHeight / imgHeight) * imgWidth
      : imgWidth;
    const finalImgHeight = imgHeight > maxImgHeight
      ? maxImgHeight
      : imgHeight;

    doc.addImage(imgData, "PNG", margin, yPos, finalImgWidth, finalImgHeight);

    // Save
    const pdfFileName = `CAD_Layout_${cadProjectorBrand || "Projection"}_${new Date().toISOString().split("T")[0]}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output("datauristring").split(",")[1];
      try {
        const result = await Filesystem.writeFile({
          path: pdfFileName,
          data: pdfBase64,
          directory: Directory.Cache,
        });
        await Share.share({ files: [result.uri] });
      } catch (err) {
        console.log("Share cancelled:", err);
      }
    } else {
      doc.save(pdfFileName);
    }
  };

  // Fullscreen page view - completely separate from main content
  if (cadFullscreen) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: darkMode ? "#0f172a" : "#f1f5f9", display: "flex", flexDirection: "column" }}>
        {/* Fullscreen Header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "#1e293b" }}>
          <h2 className="text-white font-medium">CAD Viewport</h2>
          <IOSButton
            variant="filled"
            color="red"
            onClick={() => setCadFullscreen(false)}
            icon={<Minimize2 className="w-4 h-4" />}
          >
            Exit Fullscreen
          </IOSButton>
        </div>

        {/* Fullscreen Viewport */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* Floating Toolbar */}
          <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", alignItems: "center", gap: 8, backgroundColor: darkMode ? "rgba(30,41,59,0.95)" : "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", borderRadius: 9999, padding: "8px 16px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
            <button
              onClick={() => setCadZoom((z: number) => Math.max(cadMinZoom, z - 0.1))}
              className={`p-2 rounded-full transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className={`text-sm min-w-[50px] text-center ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{(cadZoom * 100).toFixed(0)}%</span>
            <button
              onClick={() => setCadZoom((z: number) => Math.min(4, z + 0.1))}
              className={`p-2 rounded-full transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                // Calculate fit zoom for fullscreen viewport
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight - 120; // subtract header and toolbar
                const isRotated = cadRotation === 90 || cadRotation === 270;
                const effectivePdfWidth = isRotated ? cadPdfSize.height : cadPdfSize.width;
                const effectivePdfHeight = isRotated ? cadPdfSize.width : cadPdfSize.height;
                const fitZoom = Math.min(viewportWidth / effectivePdfWidth, viewportHeight / effectivePdfHeight);
                setCadZoom(fitZoom > 0 ? fitZoom : 1);
                setCadPanOffset({ x: 0, y: 0 });
              }}
              className={`px-3 py-2 text-sm rounded-full transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
            >
              Fit
            </button>
            <div className={`border-l h-6 mx-1 ${darkMode ? "border-slate-600" : "border-slate-300"}`} />
            <button
              onClick={() => setCadRotation((r: number) => (r + 90) % 360)}
              className={`p-2 rounded-full transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setCadPanMode(!cadPanMode); if (!cadPanMode) setCadLineMode(false); }}
              className={`p-2 rounded-full transition-colors ${cadPanMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : (darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200")
                }`}
            >
              <Hand className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setCadLineMode(!cadLineMode); if (!cadLineMode) setCadPanMode(false); }}
              className={`p-2 rounded-full transition-colors ${cadLineMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : (darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200")
                }`}
            >
              <Ruler className="w-5 h-5" />
            </button>
            {/* Floor Z button in fullscreen - only in section mode */}
            {cadViewMode === "section" && (
              <button
                onClick={() => {
                  if (!cadFloorZVisible) {
                    if (!cadFloorZ) {
                      setCadFloorZ({ x: cadPdfSize.width / 2, y: cadPdfSize.height * 0.8 });
                    }
                    setCadFloorZVisible(true);
                  } else {
                    setCadFloorZVisible(false);
                  }
                }}
                className={`p-2 rounded-full transition-colors ${cadFloorZVisible
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : (darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200")
                  }`}
                title="Toggle floor reference marker"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {/* Vertical line */}
                  <line x1="12" y1="3" x2="12" y2="21" />
                  {/* Top horizontal line */}
                  <line x1="8" y1="3" x2="16" y2="3" />
                  {/* Bottom horizontal line */}
                  <line x1="8" y1="21" x2="16" y2="21" />
                  {/* Top arrow head (pointing up) */}
                  <polyline points="9,7 12,3 15,7" />
                  {/* Bottom arrow head (pointing down) */}
                  <polyline points="9,17 12,21 15,17" />
                </svg>
              </button>
            )}
          </div>

          {/* Canvas Container - handles events for the entire viewport */}
          <div
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, touchAction: "none" }}
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
              if (cadPanMode) {
                setCadIsPanning(true);
                setCadPanStart({ x: e.clientX, y: e.clientY });
                return;
              }
              // Calculate coordinates relative to PDF center, accounting for pan, zoom, and rotation
              const container = e.currentTarget;
              const containerRect = container.getBoundingClientRect();
              const centerX = containerRect.width / 2;
              const centerY = containerRect.height / 2;
              const clickX = e.clientX - containerRect.left;
              const clickY = e.clientY - containerRect.top;

              // Get relative position accounting for pan and zoom
              const relX = (clickX - centerX - cadPanOffset.x) / cadZoom;
              const relY = (clickY - centerY - cadPanOffset.y) / cadZoom;

              // Unrotate coordinates
              const radians = (-cadRotation * Math.PI) / 180;
              const cos = Math.cos(radians);
              const sin = Math.sin(radians);
              const unrotatedX = relX * cos - relY * sin;
              const unrotatedY = relX * sin + relY * cos;

              // Convert to PDF coordinates
              const x = unrotatedX + cadPdfSize.width / 2;
              const y = unrotatedY + cadPdfSize.height / 2;

              // Check floor Z handle (in section mode when visible)
              if (cadViewMode === "section" && cadFloorZ && cadFloorZVisible) {
                const floorDist = Math.sqrt(
                  Math.pow(x - cadFloorZ.x, 2) + Math.pow(y - cadFloorZ.y, 2)
                );
                if (floorDist < 50) {
                  setCadDragging({ type: "floorZ" });
                  return;
                }
              }

              // Check measurement line handles first (if line mode is on)
              if (cadLineMode) {
                const startDist = Math.sqrt(
                  Math.pow(x - cadLineMeasurement.start.x, 2) + Math.pow(y - cadLineMeasurement.start.y, 2)
                );
                if (startDist < 25) {
                  setCadDragging({ type: "lineStart" });
                  return;
                }
                const endDist = Math.sqrt(
                  Math.pow(x - cadLineMeasurement.end.x, 2) + Math.pow(y - cadLineMeasurement.end.y, 2)
                );
                if (endDist < 25) {
                  setCadDragging({ type: "lineEnd" });
                  return;
                }
              }

              // Check projectors
              for (const projector of cadProjectors) {
                const projPos = cadViewMode === "plan" ? projector.planPos : projector.sectionPos;
                const projDist = Math.sqrt(Math.pow(x - projPos.x, 2) + Math.pow(y - projPos.y, 2));
                if (projDist < 70) {
                  setCadSelectedProjector(projector.id);
                  setCadDragging({ type: "projector", projectorId: projector.id });
                  return;
                }
                const scrPos = cadViewMode === "plan" ? projector.screenPlanPos : projector.screenSectionPos;
                const screenDist = Math.sqrt(Math.pow(x - scrPos.x, 2) + Math.pow(y - scrPos.y, 2));
                if (screenDist < 70) {
                  setCadSelectedProjector(projector.id);
                  setCadDragging({ type: "screen", projectorId: projector.id });
                  return;
                }
              }
            }}
            onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => {
              if (cadIsPanning && cadPanMode) {
                const dx = (e.clientX - cadPanStart.x) / cadZoom;
                const dy = (e.clientY - cadPanStart.y) / cadZoom;
                setCadPanOffset((prev: { x: number; y: number }) => constrainPanOffset({ x: prev.x + dx, y: prev.y + dy }, cadZoom));
                setCadPanStart({ x: e.clientX, y: e.clientY });
                return;
              }
              if (cadDragging) {
                const container = e.currentTarget;
                const containerRect = container.getBoundingClientRect();
                const centerX = containerRect.width / 2;
                const centerY = containerRect.height / 2;
                const clickX = e.clientX - containerRect.left;
                const clickY = e.clientY - containerRect.top;

                // Get relative position accounting for pan and zoom
                const relX = (clickX - centerX - cadPanOffset.x) / cadZoom;
                const relY = (clickY - centerY - cadPanOffset.y) / cadZoom;

                // Unrotate coordinates
                const radians = (-cadRotation * Math.PI) / 180;
                const cos = Math.cos(radians);
                const sin = Math.sin(radians);
                const unrotatedX = relX * cos - relY * sin;
                const unrotatedY = relX * sin + relY * cos;

                // Convert to PDF coordinates
                const x = unrotatedX + cadPdfSize.width / 2;
                const y = unrotatedY + cadPdfSize.height / 2;

                if (cadDragging.type === "lineStart") {
                  setCadLineMeasurement(prev => ({ ...prev, start: { x, y } }));
                } else if (cadDragging.type === "lineEnd") {
                  setCadLineMeasurement(prev => ({ ...prev, end: { x, y } }));
                } else if (cadDragging.type === "projector" && cadDragging.projectorId) {
                  const clamped = clampToCanvasBounds(x, y);
                  setCadProjectors(prev => prev.map(p => {
                    if (p.id !== cadDragging.projectorId) return p;
                    if (cadViewMode === "plan") {
                      return { ...p, planPos: clamped };
                    } else {
                      return { ...p, sectionPos: clamped };
                    }
                  }));
                } else if (cadDragging.type === "screen" && cadDragging.projectorId) {
                  const clamped = clampToCanvasBounds(x, y);
                  setCadProjectors(prev => prev.map(p => {
                    if (p.id !== cadDragging.projectorId) return p;
                    if (cadViewMode === "plan") {
                      return { ...p, screenPlanPos: clamped };
                    } else {
                      return { ...p, screenSectionPos: clamped };
                    }
                  }));
                } else if (cadDragging.type === "floorZ") {
                  const clamped = clampToCanvasBounds(x, y);
                  setCadFloorZ(clamped);
                }
              }
            }}
            onMouseUp={() => {
              setCadDragging(null);
              setCadIsPanning(false);
            }}
            onMouseLeave={() => {
              setCadDragging(null);
              setCadIsPanning(false);
            }}
            onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => {
              // Two-finger pinch-to-zoom
              if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const dist = Math.sqrt(
                  Math.pow(touch2.clientX - touch1.clientX, 2) +
                  Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                setCadPinchStartDist(dist);
                setCadPinchStartZoom(cadZoom);
                // Also start panning from the midpoint
                setCadIsPanning(true);
                setCadPanStart({
                  x: (touch1.clientX + touch2.clientX) / 2,
                  y: (touch1.clientY + touch2.clientY) / 2
                });
                return;
              }

              if (e.touches.length !== 1) return;
              const touch = e.touches[0];
              if (cadPanMode) {
                setCadIsPanning(true);
                setCadPanStart({ x: touch.clientX, y: touch.clientY });
                return;
              }
              const container = e.currentTarget;
              const containerRect = container.getBoundingClientRect();
              const centerX = containerRect.width / 2;
              const centerY = containerRect.height / 2;
              const clickX = touch.clientX - containerRect.left;
              const clickY = touch.clientY - containerRect.top;

              // Get relative position accounting for pan and zoom
              const relX = (clickX - centerX - cadPanOffset.x) / cadZoom;
              const relY = (clickY - centerY - cadPanOffset.y) / cadZoom;

              // Unrotate coordinates
              const radians = (-cadRotation * Math.PI) / 180;
              const cos = Math.cos(radians);
              const sin = Math.sin(radians);
              const unrotatedX = relX * cos - relY * sin;
              const unrotatedY = relX * sin + relY * cos;

              // Convert to PDF coordinates
              const x = unrotatedX + cadPdfSize.width / 2;
              const y = unrotatedY + cadPdfSize.height / 2;

              // Check floor Z handle (in section mode when visible)
              if (cadViewMode === "section" && cadFloorZ && cadFloorZVisible) {
                const floorDist = Math.sqrt(
                  Math.pow(x - cadFloorZ.x, 2) + Math.pow(y - cadFloorZ.y, 2)
                );
                if (floorDist < 60) {
                  setCadDragging({ type: "floorZ" });
                  return;
                }
              }

              // Check measurement line handles first (if line mode is on)
              if (cadLineMode) {
                const startDist = Math.sqrt(
                  Math.pow(x - cadLineMeasurement.start.x, 2) + Math.pow(y - cadLineMeasurement.start.y, 2)
                );
                if (startDist < 35) {
                  setCadDragging({ type: "lineStart" });
                  return;
                }
                const endDist = Math.sqrt(
                  Math.pow(x - cadLineMeasurement.end.x, 2) + Math.pow(y - cadLineMeasurement.end.y, 2)
                );
                if (endDist < 35) {
                  setCadDragging({ type: "lineEnd" });
                  return;
                }
              }

              for (const projector of cadProjectors) {
                const projPos = cadViewMode === "plan" ? projector.planPos : projector.sectionPos;
                const projDist = Math.sqrt(Math.pow(x - projPos.x, 2) + Math.pow(y - projPos.y, 2));
                if (projDist < 70) {
                  setCadSelectedProjector(projector.id);
                  setCadDragging({ type: "projector", projectorId: projector.id });
                  return;
                }
                const scrPos = cadViewMode === "plan" ? projector.screenPlanPos : projector.screenSectionPos;
                const screenDist = Math.sqrt(Math.pow(x - scrPos.x, 2) + Math.pow(y - scrPos.y, 2));
                if (screenDist < 70) {
                  setCadSelectedProjector(projector.id);
                  setCadDragging({ type: "screen", projectorId: projector.id });
                  return;
                }
              }
            }}
            onTouchMove={(e: React.TouchEvent<HTMLDivElement>) => {
              // Two-finger pinch-to-zoom and pan
              if (e.touches.length === 2 && cadPinchStartDist !== null) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDist = Math.sqrt(
                  Math.pow(touch2.clientX - touch1.clientX, 2) +
                  Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                // Calculate zoom based on pinch ratio
                const scale = currentDist / cadPinchStartDist;
                const newZoom = Math.min(4, Math.max(cadMinZoom, cadPinchStartZoom * scale));
                setCadZoom(newZoom);

                // Also pan based on midpoint movement
                const midX = (touch1.clientX + touch2.clientX) / 2;
                const midY = (touch1.clientY + touch2.clientY) / 2;
                const dx = (midX - cadPanStart.x) / newZoom;
                const dy = (midY - cadPanStart.y) / newZoom;
                setCadPanOffset((prev: { x: number; y: number }) => constrainPanOffset({ x: prev.x + dx, y: prev.y + dy }, newZoom));
                setCadPanStart({ x: midX, y: midY });
                return;
              }

              if (e.touches.length !== 1) return;
              const touch = e.touches[0];
              if (cadIsPanning && cadPanMode) {
                const dx = (touch.clientX - cadPanStart.x) / cadZoom;
                const dy = (touch.clientY - cadPanStart.y) / cadZoom;
                setCadPanOffset((prev: { x: number; y: number }) => constrainPanOffset({ x: prev.x + dx, y: prev.y + dy }, cadZoom));
                setCadPanStart({ x: touch.clientX, y: touch.clientY });
                return;
              }
              if (cadDragging) {
                const container = e.currentTarget;
                const containerRect = container.getBoundingClientRect();
                const centerX = containerRect.width / 2;
                const centerY = containerRect.height / 2;
                const clickX = touch.clientX - containerRect.left;
                const clickY = touch.clientY - containerRect.top;

                // Get relative position accounting for pan and zoom
                const relX = (clickX - centerX - cadPanOffset.x) / cadZoom;
                const relY = (clickY - centerY - cadPanOffset.y) / cadZoom;

                // Unrotate coordinates
                const radians = (-cadRotation * Math.PI) / 180;
                const cos = Math.cos(radians);
                const sin = Math.sin(radians);
                const unrotatedX = relX * cos - relY * sin;
                const unrotatedY = relX * sin + relY * cos;

                // Convert to PDF coordinates
                const x = unrotatedX + cadPdfSize.width / 2;
                const y = unrotatedY + cadPdfSize.height / 2;

                if (cadDragging.type === "lineStart") {
                  setCadLineMeasurement(prev => ({ ...prev, start: { x, y } }));
                } else if (cadDragging.type === "lineEnd") {
                  setCadLineMeasurement(prev => ({ ...prev, end: { x, y } }));
                } else if (cadDragging.type === "projector" && cadDragging.projectorId) {
                  const clamped = clampToCanvasBounds(x, y);
                  setCadProjectors(prev => prev.map(p => {
                    if (p.id !== cadDragging.projectorId) return p;
                    if (cadViewMode === "plan") {
                      return { ...p, planPos: clamped };
                    } else {
                      return { ...p, sectionPos: clamped };
                    }
                  }));
                } else if (cadDragging.type === "screen" && cadDragging.projectorId) {
                  const clamped = clampToCanvasBounds(x, y);
                  setCadProjectors(prev => prev.map(p => {
                    if (p.id !== cadDragging.projectorId) return p;
                    if (cadViewMode === "plan") {
                      return { ...p, screenPlanPos: clamped };
                    } else {
                      return { ...p, screenSectionPos: clamped };
                    }
                  }));
                } else if (cadDragging.type === "floorZ") {
                  const clamped = clampToCanvasBounds(x, y);
                  setCadFloorZ(clamped);
                }
              }
            }}
            onTouchEnd={() => {
              setCadDragging(null);
              setCadIsPanning(false);
              setCadPinchStartDist(null);
            }}
          >
            {cadPdfDocument && (
              <>
                <canvas
                  ref={cadCanvasRef}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transformOrigin: "center center",
                    transform: `translate(-50%, -50%) translate(${cadPanOffset.x}px, ${cadPanOffset.y}px) scale(${cadZoom}) rotate(${cadRotation}deg)`,
                  }}
                />
                <canvas
                  ref={cadOverlayRef}
                  className={`${cadPanMode ? "cursor-grab" : "cursor-default"} ${cadIsPanning ? "cursor-grabbing" : ""}`}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transformOrigin: "center center",
                    transform: `translate(-50%, -50%) translate(${cadPanOffset.x}px, ${cadPanOffset.y}px) scale(${cadZoom}) rotate(${cadRotation}deg)`,
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full sm:max-w-2xl rounded-none sm:rounded-2xl shadow-none sm:shadow-xl p-3 sm:p-8"
      style={{
        backgroundColor: darkMode ? "#0f172a" : "#ffffff",
        color: darkMode ? "#f1f5f9" : "#0f172a",
        minHeight: "100vh",
        paddingTop: Capacitor.isNativePlatform() ? "60px" : undefined,
        paddingBottom: "140px"
      }}
    >
      {/* Header - Simplified - Hidden on native mobile */}
      {!Capacitor.isNativePlatform() && (
        <div className="flex items-center justify-center mb-6 sm:mb-8 gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src={appIcon}
              alt="App Logo"
              style={{ width: '32px', height: '32px', minWidth: '32px' }}
              className="rounded-lg object-cover sm:w-10 sm:h-10 flex-shrink-0"
            />
            <h1 className={`text-base sm:text-2xl ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
              Projection Mapping Toolbox
            </h1>
          </div>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={projectFileInputRef}
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importProject(file);
          e.target.value = "";
        }}
      />

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-2xl">
            <h3 className="text-lg font-medium mb-4">Rename Project</h3>
            <IOSInput
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") renameProject(); }}
              className="mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <IOSButton
                variant="gray"
                onClick={() => setShowRenameModal(false)}
              >
                Cancel
              </IOSButton>
              <IOSButton
                variant="filled"
                onClick={renameProject}
              >
                Save
              </IOSButton>
            </div>
          </div>
        </div>
      )}

      {/* Projector Inventory Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border-2"
            style={{
              backgroundColor: darkMode ? "rgb(71, 85, 105)" : "#ffffff",
              borderColor: darkMode ? "#ffffff" : "rgb(226, 232, 240)"
            }}
          >
            <div className={`p-4 border-b flex items-center justify-between ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
              <h3 className={`text-lg font-medium ${darkMode ? "text-white" : "text-slate-900"}`}>Projector Inventory</h3>
              <button onClick={() => { setShowInventoryModal(false); setEditingProjector(null); }} className={`${darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600"}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingProjector ? (
              /* Edit/Add Projector Form */
              <div className="p-4 overflow-y-auto flex-1">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm block mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Brand</label>
                      <IOSInput
                        type="text"
                        value={editingProjector.brand}
                        onChange={(e) => setEditingProjector({ ...editingProjector, brand: e.target.value })}
                        placeholder="e.g. Panasonic"
                        darkMode={darkMode}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className={`text-sm block mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Model</label>
                      <IOSInput
                        type="text"
                        value={editingProjector.model}
                        onChange={(e) => setEditingProjector({ ...editingProjector, model: e.target.value })}
                        placeholder="e.g. PT-RZ120"
                        darkMode={darkMode}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm block mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Native Resolution</label>
                    <div className="grid grid-cols-2 gap-2">
                      <IOSInput
                        type="number"
                        value={editingProjector.nativeWidth}
                        onChange={(e) => setEditingProjector({ ...editingProjector, nativeWidth: e.target.value })}
                        placeholder="Width"
                        darkMode={darkMode}
                        size="sm"
                      />
                      <IOSInput
                        type="number"
                        value={editingProjector.nativeHeight}
                        onChange={(e) => setEditingProjector({ ...editingProjector, nativeHeight: e.target.value })}
                        placeholder="Height"
                        darkMode={darkMode}
                        size="sm"
                      />
                    </div>
                    <div className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-400"}`}>{editingProjector.nativeWidth} x {editingProjector.nativeHeight}</div>
                  </div>

                  <div>
                    <label className={`text-sm block mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Lumens (ANSI)</label>
                    <IOSInput
                      type="number"
                      value={editingProjector.lumens}
                      onChange={(e) => setEditingProjector({ ...editingProjector, lumens: e.target.value })}
                      darkMode={darkMode}
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className={`text-sm block mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Lens Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingProjector({ ...editingProjector, lensType: "fixed", throwRatioMax: editingProjector.throwRatioMin })}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm ${editingProjector.lensType === "fixed" ? "bg-blue-600 text-white" : (darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700")}`}
                      >
                        Fixed
                      </button>
                      <button
                        onClick={() => setEditingProjector({ ...editingProjector, lensType: "zoom" })}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm ${editingProjector.lensType === "zoom" ? "bg-blue-600 text-white" : (darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700")}`}
                      >
                        Zoom
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm block mb-1 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                      {editingProjector.lensType === "fixed" ? "Throw Ratio" : "Throw Ratio Range"}
                    </label>
                    {editingProjector.lensType === "fixed" ? (
                      <IOSInput
                        type="number"
                        step="0.01"
                        value={editingProjector.throwRatioMin}
                        onChange={(e) => setEditingProjector({ ...editingProjector, throwRatioMin: e.target.value, throwRatioMax: e.target.value })}
                        darkMode={darkMode}
                        size="sm"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <IOSInput
                          type="number"
                          step="0.01"
                          value={editingProjector.throwRatioMin}
                          onChange={(e) => setEditingProjector({ ...editingProjector, throwRatioMin: e.target.value })}
                          placeholder="Min"
                          darkMode={darkMode}
                          size="sm"
                        />
                        <IOSInput
                          type="number"
                          step="0.01"
                          value={editingProjector.throwRatioMax}
                          onChange={(e) => setEditingProjector({ ...editingProjector, throwRatioMax: e.target.value })}
                          placeholder="Max"
                          darkMode={darkMode}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <IOSButton
                    variant="gray"
                    darkMode={darkMode}
                    onClick={() => setEditingProjector(null)}
                  >
                    Cancel
                  </IOSButton>
                  <IOSButton
                    variant="filled"
                    onClick={() => saveProjectorToInventory(editingProjector)}
                    disabled={!editingProjector.brand || !editingProjector.model}
                  >
                    Save Projector
                  </IOSButton>
                </div>
              </div>
            ) : (
              /* Projector List */
              <div className="flex-1 overflow-y-auto">
                {projectorInventory.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No projectors in inventory</p>
                    <p className="text-sm mt-1">Add your first projector to get started</p>
                  </div>
                ) : (
                  <div className={`divide-y ${darkMode ? "divide-slate-700" : "divide-slate-100"}`}>
                    {projectorInventory.map(proj => (
                      <div key={proj.id} className={`p-4 flex items-center gap-4 ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"}`}>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${darkMode ? "text-white" : "text-slate-900"}`}>{proj.brand} {proj.model}</div>
                          <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            {proj.nativeWidth}x{proj.nativeHeight} • {proj.lumens} lumens • {proj.lensType === "fixed" ? `${proj.throwRatioMin}:1` : `${proj.throwRatioMin}-${proj.throwRatioMax}:1`}
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingProjector(proj)}
                          className={`p-2 rounded-lg ${darkMode ? "text-slate-400 hover:text-blue-400 hover:bg-slate-700" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProjectorFromInventory(proj.id)}
                          className={`p-2 rounded-lg ${darkMode ? "text-slate-400 hover:text-red-400 hover:bg-slate-700" : "text-slate-400 hover:text-red-600 hover:bg-red-50"}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!editingProjector && (
              <div className={`p-4 border-t ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
                <IOSButton
                  variant="filled"
                  fullWidth
                  onClick={() => setEditingProjector(createNewProjector())}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add Projector
                </IOSButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Title */}
      <h2 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 ${darkMode ? "text-white" : "text-slate-800"}`}>
        {activeTab === "cad" && "Layout Planner"}
        {activeTab === "projector" && "Throw Distance Calculator"}
        {activeTab === "resolution" && "Surface Resolution Calculator"}
        {activeTab === "aspect" && "Aspect Ratio Estimator"}
      </h2>

      {/* Tab Navigation - iOS Tab Bar */}
      <IOSTabBar
        tabs={[
          ...(ENABLE_CAD_TAB ? [{ id: "cad", label: "Layout", icon: <CADIcon className="w-8 h-8" /> }] : []),
          { id: "projector", label: "Throw", icon: <ThrowIcon className="w-8 h-8" /> },
          { id: "resolution", label: "Surface", icon: <SurfacesIcon className="w-8 h-8" /> },
          { id: "aspect", label: "Aspect", icon: <AspectIcon className="w-8 h-8" /> },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        rightElement={
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              data-haptic="light"
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
                backgroundColor: "rgba(30, 30, 30, 0.92)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
                transition: "transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                transform: projectMenuOpen ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              {projectMenuOpen ? (
                <X size={18} style={{ color: "rgba(255, 255, 255, 0.9)" }} />
              ) : (
                <Menu size={18} style={{ color: "rgba(255, 255, 255, 0.9)" }} />
              )}
            </button>

            {/* Floating Menu Dropdown */}
            {projectMenuOpen && (
              <div
                ref={projectMenuRef}
                style={{
                  position: "absolute",
                  bottom: "calc(76px + var(--ios-safe-bottom, 0px))",
                  right: "0px",
                  width: "280px",
                  borderRadius: "16px",
                  padding: "8px 0",
                  pointerEvents: "auto",
                  backdropFilter: "blur(40px)",
                  WebkitBackdropFilter: "blur(40px)",
                  backgroundColor: "rgba(30, 30, 30, 0.95)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
                  animation: "menuSlideUp 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                }}
              >
                {/* Current Project Name */}
                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>Current Project</div>
                  <div style={{ fontSize: "15px", color: "#fff", fontWeight: 500 }}>{currentProjectName}</div>
                </div>

                {/* Rename */}
                <button
                  onClick={() => { setRenameValue(currentProjectName); setShowRenameModal(true); setProjectMenuOpen(false); }}
                  style={{ width: "100%", padding: "12px 16px", textAlign: "left", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", color: "#fff", cursor: "pointer" }}
                >
                  <Edit3 style={{ width: "18px", height: "18px", color: "rgba(255,255,255,0.6)" }} />
                  Rename Project
                </button>

                {/* Save */}
                <button
                  onClick={() => { saveProject(); setProjectMenuOpen(false); }}
                  style={{ width: "100%", padding: "12px 16px", textAlign: "left", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", color: "#fff", cursor: "pointer" }}
                >
                  <Save style={{ width: "18px", height: "18px", color: "rgba(255,255,255,0.6)" }} />
                  Save Project
                </button>

                <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />

                {/* New Project */}
                <button
                  onClick={() => { newProject(); setProjectMenuOpen(false); }}
                  style={{ width: "100%", padding: "12px 16px", textAlign: "left", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", color: "#fff", cursor: "pointer" }}
                >
                  <Plus style={{ width: "18px", height: "18px", color: "rgba(255,255,255,0.6)" }} />
                  New Project
                </button>

                {/* Recent Projects */}
                {savedProjects.length > 0 && (
                  <>
                    <div style={{ padding: "8px 16px", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>Recent Projects</div>
                    <div style={{ maxHeight: "120px", overflowY: "auto" }}>
                      {savedProjects
                        .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
                        .slice(0, 5)
                        .map(project => (
                          <div key={project.id} style={{ display: "flex", alignItems: "center" }}>
                            <button
                              onClick={() => openProject(project)}
                              style={{ flex: 1, padding: "10px 16px", textAlign: "left", fontSize: "14px", background: "none", border: "none", color: "#fff", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                              {project.name}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                              style={{ padding: "10px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
                            >
                              <Trash2 style={{ width: "14px", height: "14px" }} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </>
                )}

                <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />

                {/* Projector Inventory */}
                <button
                  onClick={() => { setShowInventoryModal(true); setProjectMenuOpen(false); }}
                  style={{ width: "100%", padding: "12px 16px", textAlign: "left", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", color: "#fff", cursor: "pointer" }}
                >
                  <FileText style={{ width: "18px", height: "18px", color: "rgba(255,255,255,0.6)" }} />
                  Projector Inventory
                  <span style={{ marginLeft: "auto", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{projectorInventory.length}</span>
                </button>

                <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />

                {/* Import */}
                <button
                  onClick={() => { projectFileInputRef.current?.click(); setProjectMenuOpen(false); }}
                  style={{ width: "100%", padding: "12px 16px", textAlign: "left", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", color: "#fff", cursor: "pointer" }}
                >
                  <Upload style={{ width: "18px", height: "18px", color: "rgba(255,255,255,0.6)" }} />
                  Import JSON
                </button>

                {/* Export */}
                <button
                  onClick={() => { exportProject(); setProjectMenuOpen(false); }}
                  style={{ width: "100%", padding: "12px 16px", textAlign: "left", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", color: "#fff", cursor: "pointer" }}
                >
                  <Download style={{ width: "18px", height: "18px", color: "rgba(255,255,255,0.6)" }} />
                  Export as JSON
                </button>

              </div>
            )}
          </div>
        }
      />

      {/* Resolution Tab Content - Always render but hide when not active so export can copy from canvas */}
      <div
        style={{
          display: activeTab === "resolution" ? "block" : "none",
          animation: activeTab === "resolution" ? `${getSlideDirection("resolution")} 0.3s ease-out` : "none",
        }}
      >
        <>
          {/* Surface Size Input */}
          <IOSCard className="mb-8" darkMode={darkMode}>
            <div className="flex items-center justify-between mb-3">
              <label className={`block text-base sm:text-lg ${darkMode ? "text-white" : "text-slate-700"}`}>
                Surface Size
              </label>
              <IOSSelect
                value={unit}
                onChange={(e) =>
                  setUnit(
                    e.target.value as
                    | "inches"
                    | "cm"
                    | "feet"
                    | "meters",
                  )
                }
                options={[
                  { value: "feet", label: "Feet" },
                  { value: "inches", label: "Inches" },
                  { value: "meters", label: "Meters" },
                  { value: "cm", label: "Centimeters" },
                ]}
                darkMode={darkMode}
                size="sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className={`block text-sm mb-2 ${darkMode ? "text-white" : "text-slate-500"}`}>
                  Width
                </label>
                {unit === "feet" ? (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <IOSInput
                        type="text" inputMode="decimal" pattern="[0-9.]*"
                        value={widthFeet}
                        onChange={(e) =>
                          setWidthFeet(e.target.value)
                        }
                        placeholder="0"
                        darkMode={darkMode}
                      />
                      <span className={`text-xs mt-1 block ${darkMode ? "text-white" : "text-slate-500"}`}>
                        ft
                      </span>
                    </div>
                    <div className="flex-1">
                      <IOSInput
                        type="text" inputMode="decimal" pattern="[0-9.]*"
                        value={widthInches}
                        onChange={(e) =>
                          handleWidthInchesChange(
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        darkMode={darkMode}
                      />
                      <span className={`text-xs mt-1 block ${darkMode ? "text-white" : "text-slate-500"}`}>
                        in
                      </span>
                    </div>
                  </div>
                ) : (
                  <IOSInput
                    type="text" inputMode="decimal" pattern="[0-9.]*"
                    value={measurementWidth}
                    onChange={(e) =>
                      setMeasurementWidth(e.target.value)
                    }
                    placeholder="Width"
                    darkMode={darkMode}
                  />
                )}
              </div>
              <button
                onClick={() => {
                  // Swap width and height
                  if (unit === "feet") {
                    const tempFeet = widthFeet;
                    const tempInches = widthInches;
                    setWidthFeet(heightFeet);
                    setWidthInches(heightInches);
                    setHeightFeet(tempFeet);
                    setHeightInches(tempInches);
                  } else {
                    const tempWidth = measurementWidth;
                    setMeasurementWidth(measurementHeight);
                    setMeasurementHeight(tempWidth);
                  }
                }}
                className={`mt-6 p-2 border rounded-lg transition-colors flex-shrink-0 ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 border-slate-300 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"}`}
                style={darkMode ? { borderColor: "#ffffff" } : {}}
                title="Swap width and height"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <label className={`block text-sm mb-2 ${darkMode ? "text-white" : "text-slate-500"}`}>
                  Height
                </label>
                {unit === "feet" ? (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <IOSInput
                        type="text" inputMode="decimal" pattern="[0-9.]*"
                        value={heightFeet}
                        onChange={(e) =>
                          setHeightFeet(e.target.value)
                        }
                        placeholder="0"
                        darkMode={darkMode}
                      />
                      <span className={`text-xs mt-1 block ${darkMode ? "text-white" : "text-slate-500"}`}>
                        ft
                      </span>
                    </div>
                    <div className="flex-1">
                      <IOSInput
                        type="text" inputMode="decimal" pattern="[0-9.]*"
                        value={heightInches}
                        onChange={(e) =>
                          handleHeightInchesChange(
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        darkMode={darkMode}
                      />
                      <span className={`text-xs mt-1 block ${darkMode ? "text-white" : "text-slate-500"}`}>
                        in
                      </span>
                    </div>
                  </div>
                ) : (
                  <IOSInput
                    type="text" inputMode="decimal" pattern="[0-9.]*"
                    value={measurementHeight}
                    onChange={(e) =>
                      setMeasurementHeight(e.target.value)
                    }
                    placeholder="Height"
                    darkMode={darkMode}
                  />
                )}
              </div>
            </div>
          </IOSCard>

          {/* Canvas Resolution Input */}
          <IOSCard className="mb-8" darkMode={darkMode}>
            <h3 className={`mb-4 text-base sm:text-lg ${darkMode ? "text-white" : "text-slate-700"}`}>
              Canvas Resolution
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <label className={`block text-sm mb-2 ${darkMode ? "text-white" : "text-slate-500"}`}>
                  Width{" "}
                  {blendScaleMode === "height"
                    ? "(calculated)"
                    : ""}
                </label>
                <IOSInput
                  type="text" inputMode="decimal" pattern="[0-9.]*"
                  value={pixelWidth}
                  onChange={(e) =>
                    setPixelWidth(e.target.value)
                  }
                  placeholder={
                    blendScaleMode === "height"
                      ? "Auto-calculated"
                      : "Enter width"
                  }
                  readOnly={blendScaleMode === "height"}
                  darkMode={darkMode}
                />
              </div>
              <span className="text-slate-400 mt-6">×</span>
              <div className="flex-1">
                <label className={`block text-sm mb-2 ${darkMode ? "text-white" : "text-slate-500"}`}>
                  Height{" "}
                  {blendScaleMode === "width"
                    ? "(calculated)"
                    : ""}
                </label>
                <IOSInput
                  type="text" inputMode="decimal" pattern="[0-9.]*"
                  value={pixelHeight}
                  onChange={(e) =>
                    setPixelHeight(e.target.value)
                  }
                  placeholder={
                    blendScaleMode === "width"
                      ? "Auto-calculated"
                      : "Enter height"
                  }
                  readOnly={blendScaleMode === "width"}
                  darkMode={darkMode}
                />
              </div>
            </div>

            {/* Orientation and Lock To - below resolution inputs, labels on top */}
            <div className="flex justify-between gap-3 mt-4">
              <div className="flex-1">
                <span className={`text-xs block mb-1 ${darkMode ? "text-white" : "text-slate-500"}`}>Orientation</span>
                <div className={`flex items-center rounded-lg p-1 ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                  <button
                    onClick={() => setProjectorOrientation("landscape")}
                    className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${projectorOrientation === "landscape"
                      ? (darkMode ? "bg-slate-700 text-slate-100 shadow-sm" : "bg-white text-slate-900 shadow-sm")
                      : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")
                      }`}
                  >
                    Landscape
                  </button>
                  <button
                    onClick={() => setProjectorOrientation("portrait")}
                    className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${projectorOrientation === "portrait"
                      ? (darkMode ? "bg-slate-700 text-slate-100 shadow-sm" : "bg-white text-slate-900 shadow-sm")
                      : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")
                      }`}
                  >
                    Portrait
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <span className={`text-xs block mb-1 ${darkMode ? "text-white" : "text-slate-500"}`}>Lock To</span>
                <div className={`flex items-center rounded-lg p-1 ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                  <button
                    onClick={() => setBlendScaleMode("width")}
                    className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${blendScaleMode === "width"
                      ? (darkMode ? "bg-slate-700 text-slate-100 shadow-sm" : "bg-white text-slate-900 shadow-sm")
                      : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")
                      }`}
                  >
                    Width
                  </button>
                  <button
                    onClick={() => setBlendScaleMode("height")}
                    className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${blendScaleMode === "height"
                      ? (darkMode ? "bg-slate-700 text-slate-100 shadow-sm" : "bg-white text-slate-900 shadow-sm")
                      : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")
                      }`}
                  >
                    Height
                  </button>
                </div>
              </div>
            </div>
          </IOSCard>

          {/* Display Specifications */}
          <IOSCard className="mb-6" darkMode={darkMode}>
            <h3 className={`mb-4 text-base sm:text-lg ${darkMode ? "text-white" : "text-slate-700"}`}>
              Display Specifications
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className={`w-5 h-5 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                  <span className={`text-sm ${darkMode ? "text-white" : "text-slate-600"}`}>
                    Aspect Ratio
                  </span>
                </div>
                <div className={darkMode ? "text-blue-400" : "text-blue-600"}>
                  {getAspectRatio()}
                </div>
                <div className={`text-xs mt-1 ${darkMode ? "text-white" : "text-slate-600"}`}>
                  {(
                    parseFloat(measurementWidth) /
                    parseFloat(measurementHeight)
                  ).toFixed(2)}
                  :1
                </div>
                <div className={`text-xs mt-1 ${darkMode ? "text-white" : "text-slate-600"}`}>
                  Diagonal: {getDiagonalSize()} {getUnitLabel()}
                </div>
              </div>
              <div>
                <div className={`flex items-center gap-1 text-sm mb-2 ${darkMode ? "text-white" : "text-slate-600"}`}>
                  Pixel Pitch
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      The physical distance between pixel
                      centers on your projection surface
                    </div>
                  </div>
                </div>
                <div className={darkMode ? "text-blue-400" : "text-blue-600"}>
                  {getPixelPitch().mm} mm
                </div>
                <div className={`text-xs mt-1 ${darkMode ? "text-white" : "text-slate-600"}`}>
                  {getPixelPitch().ppi} PPI
                </div>
              </div>
              <div>
                <div className={`text-sm mb-2 ${darkMode ? "text-white" : "text-slate-600"}`}>
                  Optimal Viewing Distance
                </div>
                <div className={darkMode ? "text-blue-400" : "text-blue-600"}>
                  {getOptimalViewingDistance()}
                </div>
              </div>
            </div>
          </IOSCard>

          {/* Canvas Preview */}
          <IOSCard className="mb-6" darkMode={darkMode}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-base sm:text-lg ${darkMode ? "text-white" : "text-slate-700"}`}>
                Test Pattern Preview
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPatternMode("light")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${patternMode === "light"
                    ? "bg-blue-600 text-white"
                    : (darkMode ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-200 text-slate-700 hover:bg-slate-300")
                    }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setPatternMode("dark")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${patternMode === "dark"
                    ? "bg-blue-600 text-white"
                    : (darkMode ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-200 text-slate-700 hover:bg-slate-300")
                    }`}
                >
                  Dark
                </button>
              </div>
            </div>
            <canvas
              ref={canvasRef}
              width={1200}
              height={750}
              className="w-full border border-slate-300 rounded-lg bg-slate-50"
              style={{ maxWidth: "100%", height: "auto" }}
            ></canvas>

            {/* Test Pattern Download */}
            <div className="flex gap-2 mt-4">
              <IOSInput
                type="text"
                value={testPatternName}
                onChange={(e) =>
                  setTestPatternName(e.target.value)
                }
                placeholder="Test Pattern Name"
                className="flex-1"
                darkMode={darkMode}
              />
              <IOSButton
                variant="filled"
                onClick={downloadTestPattern}
                icon={<Download className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">Download</span>
              </IOSButton>
            </div>
          </IOSCard>

          {/* Export PDF Button */}
          <IOSCard className="mb-6" darkMode={darkMode}>
            <h3 className={`mb-4 text-base sm:text-lg ${darkMode ? "text-white" : "text-slate-700"}`}>
              Export Report
            </h3>
            <IOSButton
              variant="filled"
              color="green"
              fullWidth
              darkMode={darkMode}
              onClick={generateResolutionPDF}
              icon={<Download className="w-4 h-4" />}
            >
              Export PDF Report
            </IOSButton>
          </IOSCard>
        </>
      </div>

      {/* Aspect Ratio Estimator Tab Content */}
      <div
        style={{
          display: activeTab === "aspect" ? "block" : "none",
          animation: activeTab === "aspect" ? `${getSlideDirection("aspect")} 0.3s ease-out` : "none",
        }}
        className="h-full"
      >
        <div className="flex items-center justify-end mb-4">
          {estimatorImage && (
            <button
              onClick={clearEstimatorImage}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className={`text-sm mb-4 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
          Upload a photo or take a picture of your
          projection surface, then align the rectangle to
          match the surface edges to estimate the aspect
          ratio.
        </p>

        {!estimatorImage && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <IOSButton
              variant="filled"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload className="w-5 h-5" />}
            >
              Upload Photo of Projection Surface
            </IOSButton>
            <p className="text-slate-500 text-xs text-center">
              Upload a photo from your device's camera or
              gallery
            </p>
          </div>
        )}

        {estimatorImage && (
          <div className="space-y-4 h-full">
            <div className="bg-slate-800 rounded-lg p-2 sm:p-4">
              <canvas
                ref={estimatorCanvasRef}
                className="w-full cursor-crosshair touch-none"
                style={{ touchAction: "none" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-800 text-sm mb-3">
                <strong>Instructions:</strong> Drag the
                yellow + corners to align with your
                projection surface edges. A magnified
                circular view will appear to help you
                position precisely.
              </p>

              <div className="mb-3 space-y-2">
                <div className="flex gap-2">
                  <IOSSelect
                    value={selectedAspectRatio}
                    onChange={(e) =>
                      setSelectedAspectRatio(e.target.value)
                    }
                    options={[
                      { value: "16:9", label: "16:9 (Widescreen)" },
                      { value: "16:10", label: "16:10 (Common Projector)" },
                      { value: "4:3", label: "4:3 (Classic)" },
                      { value: "21:9", label: "21:9 (Ultrawide)" },
                      { value: "2.39:1", label: "2.39:1 (Cinematic)" },
                      { value: "1:1", label: "1:1 (Square)" },
                    ]}
                    darkMode={darkMode}
                    className="flex-1"
                  />
                  <IOSButton
                    variant={showReferenceRect ? "filled" : "tinted"}
                    onClick={() =>
                      setShowReferenceRect(
                        !showReferenceRect,
                      )
                    }
                  >
                    {showReferenceRect ? "Hide" : "Show"}
                  </IOSButton>
                </div>
                {showReferenceRect && (
                  <p className="text-blue-700 text-xs">
                    Drag the blue rectangle to move it, or
                    drag the bottom-right corner to resize
                    it.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <IOSButton
                  variant="filled"
                  className="flex-1"
                  onClick={applyEstimatedAspectRatio}
                >
                  Apply Aspect Ratio to Measurements
                </IOSButton>
                <IOSButton
                  variant="gray"
                  onClick={() => {
                    setEstimatorImage(null);
                    setAspectRatioApplied(false);
                    // Reset corners to default
                    setRectangleCorners({
                      topLeft: { x: 100, y: 100 },
                      topRight: { x: 400, y: 100 },
                      bottomRight: { x: 400, y: 300 },
                      bottomLeft: { x: 100, y: 300 },
                    });
                  }}
                  icon={<X className="w-5 h-5" />}
                >
                  Retake
                </IOSButton>
              </div>
            </div>
          </div>
        )}

        {/* Export PDF Button */}
        <div className="mt-6">
          <IOSButton
            variant="filled"
            color="green"
            fullWidth
            darkMode={darkMode}
            onClick={generateAspectPDF}
            icon={<Download className="w-4 h-4" />}
          >
            Export PDF Report
          </IOSButton>
        </div>
      </div>

      {/* Projector Setup Tab Content - Always render but hide when not active so export can copy from canvas */}
      <div
        style={{
          display: activeTab === "projector" ? "block" : "none",
          animation: activeTab === "projector" ? `${getSlideDirection("projector")} 0.3s ease-out` : "none",
        }}
      >
        <>
          {/* Projector Selector from Inventory */}
          <IOSCard className="mb-4" darkMode={darkMode}>
            <label className={`block text-sm mb-2 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Projector</label>
            <IOSSelect
              value={selectedInventoryProjector}
              onChange={(e) => applyInventoryProjector(e.target.value)}
              options={[
                { value: "custom", label: "Custom" },
                ...projectorInventory.map(proj => ({
                  value: proj.id,
                  label: `${proj.brand} ${proj.model} (${proj.nativeWidth}x${proj.nativeHeight}, ${proj.lensType === "fixed" ? `${proj.throwRatioMin}:1` : `${proj.throwRatioMin}-${proj.throwRatioMax}:1`})`
                }))
              ]}
              darkMode={darkMode}
              size="sm"
            />
            {projectorInventory.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">
                <button
                  onClick={() => setShowInventoryModal(true)}
                  className="text-blue-600 hover:underline"
                >
                  Add projectors to your inventory
                </button>
                {" "}to quickly select them here.
              </p>
            )}
          </IOSCard>

          {/* Projector Specs - MOVED TO TOP */}
          <IOSCard className="mb-8" darkMode={darkMode}>
            <h3 className={`mb-4 text-base sm:text-lg ${darkMode ? "text-white" : "text-slate-700"}`}>
              Projector Specifications
            </h3>

            {/* Aspect Ratio & Native Resolution - side by side on all screens */}
            <div className="flex flex-row gap-2 sm:gap-4 mb-2">
              <div className="w-24 sm:w-32">
                <label className={`block text-sm mb-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                  Aspect Ratio
                </label>
                <IOSSelect
                  value={projectorAspectRatio}
                  onChange={(e) => {
                    setProjectorAspectRatio(e.target.value);
                    // Auto-populate native resolution based on aspect ratio
                    const ratios: {
                      [key: string]: [string, string];
                    } = {
                      "16:9": ["1920", "1080"],
                      "16:10": ["1920", "1200"],
                      "4:3": ["1024", "768"],
                    };
                    const [w, h] = ratios[e.target.value] || [
                      "1920",
                      "1080",
                    ];
                    setProjectorNativeWidth(w);
                    setProjectorNativeHeight(h);
                  }}
                  options={[
                    { value: "16:9", label: "16:9" },
                    { value: "16:10", label: "16:10" },
                    { value: "4:3", label: "4:3" },
                  ]}
                  darkMode={darkMode}
                  size="sm"
                />
              </div>
              <div className="flex-1">
                <label className={`block text-sm mb-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                  Native Resolution
                </label>
                <div className="flex gap-1 sm:gap-2 items-center">
                  <IOSInput
                    type="text" inputMode="decimal" pattern="[0-9.]*"
                    value={projectorNativeWidth}
                    onChange={(e) =>
                      setProjectorNativeWidth(e.target.value)
                    }
                    placeholder="1920"
                    darkMode={darkMode}
                    className="w-20 sm:w-28"
                    size="sm"
                  />
                  <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-400"}`}>
                    ×
                  </span>
                  <IOSInput
                    type="text" inputMode="decimal" pattern="[0-9.]*"
                    value={projectorNativeHeight}
                    onChange={(e) =>
                      setProjectorNativeHeight(e.target.value)
                    }
                    placeholder="1080"
                    darkMode={darkMode}
                    className="w-20 sm:w-28"
                    size="sm"
                  />
                </div>
              </div>
            </div>
            {/* Resolution preset buttons - spans full width */}
            <div className="flex flex-wrap gap-1 mb-4">
              <button
                onClick={() => {
                  setProjectorNativeWidth("1920");
                  setProjectorNativeHeight("1080");
                  setProjectorAspectRatio("16:9");
                }}
                className={`px-2 py-0.5 text-xs rounded border transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300"}`}
                style={darkMode ? { borderColor: "#ffffff" } : {}}
              >
                1080p
              </button>
              <button
                onClick={() => {
                  setProjectorNativeWidth("1920");
                  setProjectorNativeHeight("1200");
                  setProjectorAspectRatio("16:10");
                }}
                className={`px-2 py-0.5 text-xs rounded border transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300"}`}
                style={darkMode ? { borderColor: "#ffffff" } : {}}
              >
                WUXGA
              </button>
              <button
                onClick={() => {
                  setProjectorNativeWidth("2560");
                  setProjectorNativeHeight("1600");
                  setProjectorAspectRatio("16:10");
                }}
                className={`px-2 py-0.5 text-xs rounded border transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300"}`}
                style={darkMode ? { borderColor: "#ffffff" } : {}}
              >
                WQXGA
              </button>
              <button
                onClick={() => {
                  setProjectorNativeWidth("3840");
                  setProjectorNativeHeight("2160");
                  setProjectorAspectRatio("16:9");
                }}
                className={`px-2 py-0.5 text-xs rounded border transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300"}`}
                style={darkMode ? { borderColor: "#ffffff" } : {}}
              >
                4K
              </button>
            </div>

            {/* Lumens and Screen Gain - on same line */}
            <div className="flex flex-row gap-2 sm:gap-4 items-end mb-4">
              <div className="flex-1">
                <label className={`block text-sm mb-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                  Lumens (ANSI)
                </label>
                <IOSInput
                  type="text" inputMode="decimal" pattern="[0-9.]*"
                  value={lumens}
                  onChange={(e) => setLumens(e.target.value)}
                  placeholder="0"
                  darkMode={darkMode}
                  size="sm"
                />
              </div>

              <div className="w-20 sm:w-24">
                <label className={`flex items-center gap-1 text-sm mb-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                  <span className="hidden sm:inline">
                    Screen Gain
                  </span>
                  <span className="sm:hidden">Gain</span>
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Surface reflectivity (1.0 = matte white,
                      &gt;1 = brighter but narrower viewing
                      angle)
                    </div>
                  </div>
                </label>
                <IOSInput
                  type="text" inputMode="decimal" pattern="[0-9.]*"
                  step="0.1"
                  value={screenGain}
                  onChange={(e) =>
                    setScreenGain(e.target.value)
                  }
                  placeholder="1"
                  darkMode={darkMode}
                  size="sm"
                />
              </div>

              <div
                className="w-24 sm:w-32 rounded-lg p-2 sm:p-3 transition-colors duration-500 border"
                style={{
                  backgroundColor: getFootLambertsColor().bg,
                  borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "transparent",
                }}
              >
                <div className="flex items-center gap-1 text-slate-700 text-xs">
                  <span className="hidden sm:inline">
                    Foot Lamberts
                    {projectorMode === "stacked" &&
                      " (Stacked)"}
                    {projectorMode === "blended" &&
                      " (Blended)"}
                    {projectorMode === "single" && " (Single)"}
                  </span>
                  <span className="sm:hidden">fL</span>
                  <div className="group relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      Actual brightness on the projection
                      surface (14-16 fL = cinema, 32 fL = bright
                      room)
                    </div>
                  </div>
                </div>
                <div
                  className="text-lg sm:text-xl"
                  style={{ color: getFootLambertsColor().text }}
                >
                  {getFootLamberts()}
                </div>
              </div>
            </div>

            {/* fL Buttons Row */}
            <div className="flex gap-1 sm:gap-2 mb-4">
              <button
                onClick={() => calculateRequiredLumens(16)}
                className="flex-1 px-2 sm:px-3 py-2 bg-orange-200 text-orange-900 rounded-lg hover:bg-orange-300 transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                16 fL
              </button>
              <button
                onClick={() => calculateRequiredLumens(32)}
                className="flex-1 px-2 sm:px-3 py-2 bg-green-200 text-green-900 rounded-lg hover:bg-green-300 transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                32 fL
              </button>
              <button
                onClick={() => calculateRequiredLumens(48)}
                className="flex-1 px-2 sm:px-3 py-2 bg-yellow-200 text-yellow-900 rounded-lg hover:bg-yellow-300 transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                48 fL
              </button>
            </div>
          </IOSCard>

          {/* Surface Size Input */}
          <IOSCard className="mb-8" darkMode={darkMode}>
            <div className="flex items-center justify-between mb-3">
              <label className={`block text-base sm:text-lg ${darkMode ? "text-white" : "text-slate-700"}`}>
                Surface Size
              </label>
              <IOSSelect
                value={unit}
                onChange={(e) =>
                  setUnit(
                    e.target.value as
                    | "inches"
                    | "cm"
                    | "feet"
                    | "meters",
                  )
                }
                options={[
                  { value: "feet", label: "Feet" },
                  { value: "inches", label: "Inches" },
                  { value: "meters", label: "Meters" },
                  { value: "cm", label: "Centimeters" },
                ]}
                darkMode={darkMode}
                size="sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className={`block text-sm mb-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                  Width
                </label>
                {unit === "feet" ? (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <IOSInput
                        type="text" inputMode="decimal" pattern="[0-9.]*"
                        value={widthFeet}
                        onChange={(e) =>
                          setWidthFeet(e.target.value)
                        }
                        placeholder="0"
                        darkMode={darkMode}
                      />
                      <span className={`text-xs mt-1 block ${darkMode ? "text-white" : "text-slate-500"}`}>
                        ft
                      </span>
                    </div>
                    <div className="flex-1">
                      <IOSInput
                        type="text" inputMode="decimal" pattern="[0-9.]*"
                        value={widthInches}
                        onChange={(e) =>
                          handleWidthInchesChange(
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        darkMode={darkMode}
                      />
                      <span className={`text-xs mt-1 block ${darkMode ? "text-white" : "text-slate-500"}`}>
                        in
                      </span>
                    </div>
                  </div>
                ) : (
                  <IOSInput
                    type="text" inputMode="decimal" pattern="[0-9.]*"
                    value={measurementWidth}
                    onChange={(e) =>
                      setMeasurementWidth(e.target.value)
                    }
                    placeholder="Width"
                    darkMode={darkMode}
                  />
                )}
              </div>
              <button
                onClick={() => {
                  // Swap width and height
                  if (unit === "feet") {
                    const tempFeet = widthFeet;
                    const tempInches = widthInches;
                    setWidthFeet(heightFeet);
                    setWidthInches(heightInches);
                    setHeightFeet(tempFeet);
                    setHeightInches(tempInches);
                  } else {
                    const tempWidth = measurementWidth;
                    setMeasurementWidth(measurementHeight);
                    setMeasurementHeight(tempWidth);
                  }
                }}
                className={`mt-6 p-2 border rounded-lg transition-colors flex-shrink-0 ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 border-slate-300 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"}`}
                style={darkMode ? { borderColor: "#ffffff" } : {}}
                title="Swap width and height"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <label className={`block text-sm mb-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                  Height
                </label>
                {unit === "feet" ? (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <IOSInput
                        type="text" inputMode="decimal" pattern="[0-9.]*"
                        value={heightFeet}
                        onChange={(e) =>
                          setHeightFeet(e.target.value)
                        }
                        placeholder="0"
                        darkMode={darkMode}
                      />
                      <span className={`text-xs mt-1 block ${darkMode ? "text-white" : "text-slate-500"}`}>
                        ft
                      </span>
                    </div>
                    <div className="flex-1">
                      <IOSInput
                        type="text" inputMode="decimal" pattern="[0-9.]*"
                        value={heightInches}
                        onChange={(e) =>
                          handleHeightInchesChange(
                            e.target.value,
                          )
                        }
                        placeholder="0"
                        darkMode={darkMode}
                      />
                      <span className={`text-xs mt-1 block ${darkMode ? "text-white" : "text-slate-500"}`}>
                        in
                      </span>
                    </div>
                  </div>
                ) : (
                  <IOSInput
                    type="text" inputMode="decimal" pattern="[0-9.]*"
                    value={measurementHeight}
                    onChange={(e) =>
                      setMeasurementHeight(e.target.value)
                    }
                    placeholder="Height"
                    darkMode={darkMode}
                  />
                )}
              </div>
            </div>
          </IOSCard>

          {/* Throw Ratio and Distance */}
          <IOSCard className="mb-8" darkMode={darkMode}>
            <div className="flex items-center justify-between mb-4">
              <label className={`block ${darkMode ? "text-white" : "text-slate-700"}`}>
                Throw Ratio & Distance
              </label>
              <div className={`flex items-center rounded-lg p-1 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                <button
                  onClick={() => setZoomEnabled(false)}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${!zoomEnabled
                    ? (darkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm")
                    : (darkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900")
                    }`}
                >
                  Fixed Lens
                </button>
                <button
                  onClick={() => setZoomEnabled(true)}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${zoomEnabled
                    ? (darkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm")
                    : (darkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900")
                    }`}
                >
                  Zoom Lens
                </button>
              </div>
            </div>

            {!zoomEnabled ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`flex items-center gap-1 text-sm mb-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                    Throw Ratio
                    <div className="group relative">
                      <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg">
                        Throw distance divided by image width
                        (e.g., 1.5 means projector is 1.5× the
                        width away)
                      </div>
                    </div>
                  </label>
                  <IOSInput
                    type="text" inputMode="decimal" pattern="[0-9.]*"
                    step="0.1"
                    value={throwRatio}
                    onChange={(e) =>
                      setThrowRatio(e.target.value)
                    }
                    placeholder="1.5"
                    darkMode={darkMode}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                    Throw Distance
                  </label>
                  <div className={`w-full px-4 py-3 border rounded-lg flex items-center ${darkMode ? "border-slate-600 bg-blue-900/30 text-blue-400" : "border-slate-300 bg-blue-50 text-blue-600"}`}>
                    {getThrowDistance()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm mb-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                      Min Throw Ratio
                    </label>
                    <IOSInput
                      type="text" inputMode="decimal" pattern="[0-9.]*"
                      step="0.1"
                      value={throwRatioMin}
                      onChange={(e) => {
                        setThrowRatioMin(e.target.value);
                        // Ensure current throw ratio is within bounds
                        const minVal = parseFloat(
                          e.target.value,
                        );
                        const maxVal =
                          parseFloat(throwRatioMax);
                        const currentVal =
                          parseFloat(throwRatio);
                        if (
                          !isNaN(minVal) &&
                          !isNaN(currentVal) &&
                          currentVal < minVal
                        ) {
                          setThrowRatio(e.target.value);
                        }
                      }}
                      placeholder="1.2"
                      darkMode={darkMode}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-2 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                      Max Throw Ratio
                    </label>
                    <IOSInput
                      type="text" inputMode="decimal" pattern="[0-9.]*"
                      step="0.1"
                      value={throwRatioMax}
                      onChange={(e) => {
                        setThrowRatioMax(e.target.value);
                        // Ensure current throw ratio is within bounds
                        const minVal =
                          parseFloat(throwRatioMin);
                        const maxVal = parseFloat(
                          e.target.value,
                        );
                        const currentVal =
                          parseFloat(throwRatio);
                        if (
                          !isNaN(maxVal) &&
                          !isNaN(currentVal) &&
                          currentVal > maxVal
                        ) {
                          setThrowRatio(e.target.value);
                        }
                      }}
                      placeholder="1.8"
                      darkMode={darkMode}
                    />
                  </div>
                </div>

                <div className={`rounded-lg p-4 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`block text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                      Current Throw Ratio
                    </label>
                    <span className="text-blue-600 font-medium">
                      {throwRatio}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={throwRatioMin}
                    max={throwRatioMax}
                    step="0.01"
                    value={throwRatio}
                    onChange={(e) =>
                      setThrowRatio(e.target.value)
                    }
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((parseFloat(throwRatio) -
                        parseFloat(throwRatioMin)) /
                        (parseFloat(throwRatioMax) -
                          parseFloat(throwRatioMin))) *
                        100
                        }%, #e2e8f0 ${((parseFloat(throwRatio) -
                          parseFloat(throwRatioMin)) /
                          (parseFloat(throwRatioMax) -
                            parseFloat(throwRatioMin))) *
                        100
                        }%, #e2e8f0 100%)`,
                    }}
                  />
                  <div className={`flex justify-between text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    <span>Wide ({throwRatioMin})</span>
                    <span>Tele ({throwRatioMax})</span>
                  </div>
                  <div className={`mt-3 pt-3 border-t ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        Throw Distance:
                      </span>
                      <span className={`font-medium ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                        {(() => {
                          const nativeW =
                            parseFloat(projectorNativeWidth) ||
                            1920;
                          const nativeH =
                            parseFloat(projectorNativeHeight) ||
                            1080;
                          const aspectRatio = nativeW / nativeH;
                          const ratio = parseFloat(throwRatio);
                          const width =
                            parseFloat(measurementWidth);
                          const distance =
                            projectorOrientation === "landscape"
                              ? ratio * width
                              : ratio * width * aspectRatio;
                          return distance.toFixed(2);
                        })()}{" "}
                        {getUnitLabel()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </IOSCard>

          {/* Projector Canvas Preview */}
          <div className="mb-8">
            <label className={`block mb-3 ${darkMode ? "text-white" : "text-slate-700"}`}>
              Projection Throw Diagram
            </label>

            {/* View Toggle - Above canvas */}
            <div className={`flex items-center justify-center rounded-lg p-1 mb-3 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
              <button
                onClick={() => setDiagramView("plan")}
                className={`flex-1 px-4 py-1.5 text-sm rounded-md transition-colors ${diagramView === "plan"
                  ? (darkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm")
                  : (darkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900")
                  }`}
              >
                Top View
              </button>
              <button
                onClick={() => setDiagramView("section")}
                className={`flex-1 px-4 py-1.5 text-sm rounded-md transition-colors ${diagramView === "section"
                  ? (darkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm")
                  : (darkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900")
                  }`}
              >
                Section
              </button>
            </div>

            <div className="relative">
              <canvas
                ref={projectorCanvasRef}
                className="w-full border border-slate-300 rounded-lg bg-white"
              ></canvas>
            </div>

            {/* Orientation and Scale To - below canvas, labels on top */}
            <div className="flex justify-between gap-3 mt-3">
              <div className="flex-1">
                <span className={`text-xs block mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Orientation</span>
                <div className={`flex items-center rounded-lg p-1 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                  <button
                    onClick={() => setProjectorOrientation("landscape")}
                    className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${projectorOrientation === "landscape"
                      ? (darkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm")
                      : (darkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900")
                      }`}
                  >
                    Landscape
                  </button>
                  <button
                    onClick={() => setProjectorOrientation("portrait")}
                    className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${projectorOrientation === "portrait"
                      ? (darkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm")
                      : (darkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900")
                      }`}
                  >
                    Portrait
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <span className={`text-xs block mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Scale To</span>
                <div className={`flex items-center rounded-lg p-1 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                  <button
                    onClick={() => setBlendScaleMode("width")}
                    className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${blendScaleMode === "width"
                      ? (darkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm")
                      : (darkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900")
                      }`}
                  >
                    Width
                  </button>
                  <button
                    onClick={() => setBlendScaleMode("height")}
                    className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${blendScaleMode === "height"
                      ? (darkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm")
                      : (darkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900")
                      }`}
                  >
                    Height
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Info - below canvas */}
            <div className="md:hidden mt-3 space-y-3">

              {/* Diagram Info */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2.5 text-sm border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    Surface Size:
                  </span>
                  <span className="text-slate-900">
                    {parseFloat(measurementWidth).toFixed(1)} ×{" "}
                    {parseFloat(measurementHeight).toFixed(1)}{" "}
                    {getUnitLabel()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    Diagonal:
                  </span>
                  <span className="text-slate-900">
                    {getDiagonalSize()}
                    {getUnitLabel()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    Throw Distance:
                  </span>
                  <span className="text-slate-900">
                    {getThrowDistance()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    Throw Ratio:
                  </span>
                  <span className="text-slate-900">
                    {zoomEnabled
                      ? `${throwRatioMin} - ${throwRatioMax}`
                      : throwRatio}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    Brightness:
                  </span>
                  <span className="text-slate-900">
                    {getFootLamberts()} (
                    {parseFloat(lumens).toLocaleString()}{" "}
                    lumens)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    Orientation:
                  </span>
                  <span className="text-slate-900">
                    {projectorOrientation === "landscape"
                      ? "Landscape"
                      : "Portrait 90°"}
                  </span>
                </div>
                {projectorMode === "stacked" && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-600">
                      Projectors:
                    </span>
                    <span className="text-slate-900">
                      {projectorCount}× Stacked (
                      {(
                        parseFloat(lumens) * projectorCount
                      ).toLocaleString()}{" "}
                      lumens total)
                    </span>
                  </div>
                )}
                {projectorMode === "blended" && (
                  <>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-slate-600">
                        Projectors:
                      </span>
                      <span className="text-slate-900">
                        {projectorCount}× Blended
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">
                        Overlap:
                      </span>
                      <span className="text-slate-900">
                        {blendOverlap}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">
                        Each Projector:
                      </span>
                      <span className="text-slate-900">
                        {(
                          (parseFloat(measurementWidth) *
                            (1 + blendOverlap / 100)) /
                          projectorCount
                        ).toFixed(1)}
                        {getUnitLabel()} wide
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Multiple Projector Setup */}
          <IOSCard className="mb-6" darkMode={darkMode}>
            <h3 className={`text-base sm:text-lg mb-4 ${darkMode ? "text-white" : "text-slate-700"}`}>
              Multi-Projector Setup
            </h3>

            <div className="flex flex-wrap gap-2 sm:gap-4 mb-4">
              <div className="w-32 sm:w-36">
                <label className="block text-slate-500 text-sm mb-2">
                  Configuration
                </label>
                <IOSSelect
                  value={projectorMode}
                  onChange={(e) =>
                    setProjectorMode(
                      e.target.value as
                      | "single"
                      | "stacked"
                      | "blended",
                    )
                  }
                  options={[
                    { value: "single", label: "Single" },
                    { value: "stacked", label: "Stacked" },
                    { value: "blended", label: "Blended" },
                  ]}
                  darkMode={darkMode}
                  size="sm"
                />
              </div>

              {projectorMode !== "single" && (
                <div className="w-24 sm:w-32">
                  <label className="block text-slate-500 text-sm mb-2">
                    Projectors
                  </label>
                  <IOSInput
                    type="text" inputMode="decimal" pattern="[0-9.]*"
                    min="2"
                    max="8"
                    value={projectorCount}
                    onChange={(e) =>
                      setProjectorCount(
                        Math.max(
                          2,
                          Math.min(
                            8,
                            parseInt(e.target.value) || 2,
                          ),
                        ),
                      )
                    }
                    darkMode={darkMode}
                    size="sm"
                  />
                </div>
              )}

              {projectorMode === "blended" && (
                <div className="w-24 sm:w-32">
                  <label className="block text-slate-500 text-sm mb-2">
                    Overlap %
                  </label>
                  <IOSInput
                    type="text" inputMode="decimal" pattern="[0-9.]*"
                    min="0"
                    max="100"
                    value={blendOverlap}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value)) {
                        setBlendOverlap(0);
                      } else {
                        const clampedValue = Math.max(
                          0,
                          Math.min(100, value),
                        );
                        if (clampedValue === 100) {
                          setProjectorMode("stacked");
                        } else {
                          setBlendOverlap(clampedValue);
                        }
                      }
                    }}
                    darkMode={darkMode}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </IOSCard>

          {/* Projection to Surface Difference */}
          <div className="mt-8 border-t pt-8">
            <h3 className="text-slate-700 mb-4">
              Projection to Surface Difference
            </h3>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <div className="text-red-600">
                  Projector Output
                </div>
                <div className="text-red-900">
                  {(() => {
                    const nativeW =
                      parseFloat(projectorNativeWidth) || 1920;
                    const nativeH =
                      parseFloat(projectorNativeHeight) || 1080;
                    const surfaceW =
                      parseFloat(measurementWidth) || 18;
                    const surfaceH =
                      parseFloat(measurementHeight) || 9;
                    const ratio = parseFloat(throwRatio) || 1.5;

                    // Calculate individual projector output dimensions
                    let individualWidth, individualHeight;

                    // For blended mode, each projector covers a portion of the surface
                    if (
                      projectorMode === "blended" &&
                      projectorCount > 1
                    ) {
                      const overlapDecimal = blendOverlap / 100;

                      if (blendScaleMode === "width") {
                        // Each projector width = surfaceW / (count - overlap * (count-1))
                        individualWidth =
                          surfaceW /
                          (projectorCount -
                            overlapDecimal *
                            (projectorCount - 1));
                        if (
                          projectorOrientation === "landscape"
                        ) {
                          const pixelPitchW =
                            individualWidth / nativeW;
                          individualHeight =
                            nativeH * pixelPitchW;
                        } else {
                          const pixelPitchW =
                            individualWidth / nativeH;
                          individualHeight =
                            nativeW * pixelPitchW;
                        }
                      } else {
                        // Scale to Height mode
                        individualHeight = surfaceH;
                        if (
                          projectorOrientation === "landscape"
                        ) {
                          const pixelPitchH =
                            surfaceH / nativeH;
                          individualWidth =
                            nativeW * pixelPitchH;
                        } else {
                          const pixelPitchH =
                            surfaceH / nativeW;
                          individualWidth =
                            nativeH * pixelPitchH;
                        }
                      }

                      // Calculate total combined dimensions
                      const totalWidth =
                        individualWidth * projectorCount -
                        individualWidth *
                        (projectorCount - 1) *
                        overlapDecimal;
                      return `${totalWidth.toFixed(2)} × ${individualHeight.toFixed(2)} ${getUnitLabel()} (covering)`;
                    } else {
                      // Single or stacked mode - each projector fills the scaled surface
                      if (blendScaleMode === "width") {
                        individualWidth = surfaceW;
                        if (
                          projectorOrientation === "landscape"
                        ) {
                          const pixelPitchW =
                            surfaceW / nativeW;
                          individualHeight =
                            nativeH * pixelPitchW;
                        } else {
                          const pixelPitchW =
                            surfaceW / nativeH;
                          individualHeight =
                            nativeW * pixelPitchW;
                        }
                      } else {
                        individualHeight = surfaceH;
                        if (
                          projectorOrientation === "landscape"
                        ) {
                          const pixelPitchH =
                            surfaceH / nativeH;
                          individualWidth =
                            nativeW * pixelPitchH;
                        } else {
                          const pixelPitchH =
                            surfaceH / nativeW;
                          individualWidth =
                            nativeH * pixelPitchH;
                        }
                      }
                      return `${individualWidth.toFixed(2)} × ${individualHeight.toFixed(2)} ${getUnitLabel()} (covering)`;
                    }
                  })()}
                </div>
                <div className="text-red-700 text-xs mt-1">
                  {(() => {
                    const nativeW =
                      parseFloat(projectorNativeWidth) || 1920;
                    const nativeH =
                      parseFloat(projectorNativeHeight) || 1080;

                    const nativeText =
                      projectorOrientation === "portrait"
                        ? `${projectorNativeHeight} × ${projectorNativeWidth}`
                        : `${projectorNativeWidth} × ${projectorNativeHeight}`;

                    if (
                      projectorMode === "blended" &&
                      projectorCount > 1
                    ) {
                      const overlapDecimal = blendOverlap / 100;
                      const totalPixelsW = Math.round(
                        nativeW * projectorCount -
                        nativeW *
                        (projectorCount - 1) *
                        overlapDecimal,
                      );
                      return `Blended Canvas: ${totalPixelsW} × ${nativeH} px | Native: ${nativeText} px each`;
                    } else if (
                      projectorMode === "stacked" &&
                      projectorCount > 1
                    ) {
                      return `Native: ${nativeText} px (Stacked)`;
                    } else {
                      return `Native: ${nativeText} px`;
                    }
                  })()}
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-blue-600">
                  Surface / Canvas
                </div>
                <div className="text-blue-900">
                  {measurementWidth} × {measurementHeight}{" "}
                  {getUnitLabel()}
                </div>
                <div className="text-blue-700 text-xs mt-1">
                  Resolution:{" "}
                  {(() => {
                    const nativeW =
                      parseFloat(projectorNativeWidth) || 1920;
                    const nativeH =
                      parseFloat(projectorNativeHeight) || 1080;
                    const surfaceW =
                      parseFloat(measurementWidth) || 18;
                    const surfaceH =
                      parseFloat(measurementHeight) || 9;

                    // The surface/canvas resolution is what you design your content at
                    // This is based on fitting the surface within the native aspect ratio

                    if (blendScaleMode === "width") {
                      // Scale to Width: width = native, height scales proportionally
                      const canvasPixelWidth = nativeW;
                      const canvasPixelHeight = Math.round(
                        (surfaceH / surfaceW) * nativeW,
                      );
                      return `${canvasPixelWidth} × ${canvasPixelHeight} px`;
                    } else {
                      // Scale to Height: height = native, width scales proportionally
                      const canvasPixelHeight = nativeH;
                      const canvasPixelWidth = Math.round(
                        (surfaceW / surfaceH) * nativeH,
                      );
                      return `${canvasPixelWidth} × ${canvasPixelHeight} px`;
                    }
                  })()}
                </div>
                <div className="text-blue-600 text-xs mt-1">
                  Diagonal: {getDiagonalSize()} {getUnitLabel()}
                </div>
              </div>
            </div>

            {/* Canvas Preview */}
            <div className="bg-slate-800 rounded-lg p-8">
              <canvas
                ref={differenceCanvasRef}
                className="w-full"
                style={{ display: "block" }}
              />
            </div>
          </div>

          {/* Export PDF Button */}
          <div className="mt-6">
            <IOSButton
              variant="filled"
              color="green"
              fullWidth
              onClick={generateThrowPDF}
              icon={<Download className="w-4 h-4" />}
            >
              Export PDF Report
            </IOSButton>
          </div>
        </>
      </div>

      {/* CAD Tab Content */}
      {
        ENABLE_CAD_TAB && (
          <div
            style={{
              display: activeTab === "cad" ? "block" : "none",
              paddingBottom: "calc(88px + var(--ios-safe-bottom, 0px))", // Space for iOS tab bar
              animation: activeTab === "cad" ? `${getSlideDirection("cad")} 0.3s ease-out` : "none",
            }}
          >
            <>
              {/* PDF Import Section */}
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                  <input
                    type="file"
                    ref={cadPdfInputRef}
                    accept=".pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          console.log("PDF file selected:", file.name, file.size);
                          setCadPdfFile(file);
                          const arrayBuffer = await file.arrayBuffer();
                          console.log("ArrayBuffer loaded, size:", arrayBuffer.byteLength);

                          // Convert to base64 for persistence
                          const bytes = new Uint8Array(arrayBuffer);
                          let binaryString = '';
                          for (let i = 0; i < bytes.length; i++) {
                            binaryString += String.fromCharCode(bytes[i]);
                          }
                          const base64Data = btoa(binaryString);
                          setCadPdfData(base64Data);

                          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                          console.log("PDF loaded, pages:", pdf.numPages);
                          setCadPdfDocument(pdf);
                          setCadTotalPages(pdf.numPages);
                          setCadCurrentPage(1);
                        } catch (err) {
                          console.error("PDF import error:", err);
                          alert("Error loading PDF: " + (err instanceof Error ? err.message : String(err)));
                        }
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <IOSButton
                      variant="filled"
                      onClick={() => cadPdfInputRef.current?.click()}
                      icon={<FileUp className="w-4 h-4" />}
                    >
                      Import PDF
                    </IOSButton>
                    <div className={`hidden sm:block border-l h-6 mx-2 ${darkMode ? "border-slate-600" : "border-slate-300"}`} />
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Units:</span>
                      <IOSSelect
                        value={cadUnit}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCadUnit(e.target.value as "inches" | "cm" | "feet" | "meters")}
                        options={[
                          { value: "feet", label: "Feet" },
                          { value: "inches", label: "Inches" },
                          { value: "meters", label: "Meters" },
                          { value: "cm", label: "Centimeters" }
                        ]}
                        darkMode={darkMode}
                        size="sm"
                        variant="default"
                        fullWidth={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Scale Settings */}
                <div className={`rounded-xl p-3 sm:p-4 mb-4 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3">
                    <span className={`text-sm font-medium whitespace-nowrap ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Drawing Scale:</span>
                    <div className={`flex items-center rounded-lg p-1 flex-shrink-0 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                      <button
                        onClick={() => setCadScaleMode("architect")}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${cadScaleMode === "architect"
                          ? (darkMode ? "bg-slate-600 text-slate-100 shadow-sm" : "bg-white text-slate-900 shadow-sm")
                          : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")
                          }`}
                      >
                        Architect
                      </button>
                      <button
                        onClick={() => setCadScaleMode("custom")}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${cadScaleMode === "custom"
                          ? (darkMode ? "bg-slate-600 text-slate-100 shadow-sm" : "bg-white text-slate-900 shadow-sm")
                          : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")
                          }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {cadScaleMode === "architect" ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={cadScale}
                        onChange={(e) => setCadScale(e.target.value)}
                        className={`px-2 sm:px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${darkMode ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-300"}`}
                      >
                        <optgroup label="Imperial (Architect)">
                          <option value="1/32">1/32&quot; = 1&apos;-0&quot;</option>
                          <option value="1/16">1/16&quot; = 1&apos;-0&quot;</option>
                          <option value="1/8">1/8&quot; = 1&apos;-0&quot;</option>
                          <option value="3/16">3/16&quot; = 1&apos;-0&quot;</option>
                          <option value="1/4">1/4&quot; = 1&apos;-0&quot;</option>
                          <option value="3/8">3/8&quot; = 1&apos;-0&quot;</option>
                          <option value="1/2">1/2&quot; = 1&apos;-0&quot;</option>
                          <option value="3/4">3/4&quot; = 1&apos;-0&quot;</option>
                          <option value="1">1&quot; = 1&apos;-0&quot;</option>
                          <option value="1-1/2">1-1/2&quot; = 1&apos;-0&quot;</option>
                          <option value="2">2&quot; = 1&apos;-0&quot;</option>
                          <option value="3">3&quot; = 1&apos;-0&quot;</option>
                        </optgroup>
                        <optgroup label="Imperial (Engineering)">
                          <option value="1=10">1&quot; = 10&apos;</option>
                          <option value="1=20">1&quot; = 20&apos;</option>
                          <option value="1=30">1&quot; = 30&apos;</option>
                          <option value="1=40">1&quot; = 40&apos;</option>
                          <option value="1=50">1&quot; = 50&apos;</option>
                          <option value="1=100">1&quot; = 100&apos;</option>
                        </optgroup>
                        <optgroup label="Metric">
                          <option value="1:1">1:1</option>
                          <option value="1:2">1:2</option>
                          <option value="1:4">1:4</option>
                          <option value="1:5">1:5</option>
                          <option value="1:8">1:8</option>
                          <option value="1:10">1:10</option>
                          <option value="1:20">1:20</option>
                          <option value="1:25">1:25</option>
                          <option value="1:50">1:50</option>
                          <option value="1:100">1:100</option>
                          <option value="1:200">1:200</option>
                          <option value="1:500">1:500</option>
                          <option value="1:1000">1:1000</option>
                          <option value="1:5000">1:5000</option>
                          <option value="1:10000">1:10000</option>
                        </optgroup>
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>1 inch =</span>
                      <IOSInput
                        type="number"
                        value={cadCustomScale}
                        onChange={(e) => setCadCustomScale(e.target.value)}
                        darkMode={darkMode}
                        size="sm"
                        className="w-16 sm:w-20"
                      />
                      <span className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>feet</span>
                    </div>
                  )}

                  {/* View Mode and Aspect Ratio */}
                  <div className={`flex flex-wrap items-center gap-3 sm:gap-4 mt-3 pt-3 border-t ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>View:</span>
                      <div className={`flex items-center rounded-lg p-1 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                        <button
                          onClick={() => setCadViewMode("plan")}
                          className={`px-2 sm:px-3 py-1 text-sm rounded-md transition-colors ${cadViewMode === "plan"
                            ? (darkMode ? "bg-slate-600 text-slate-100 shadow-sm" : "bg-white text-slate-900 shadow-sm")
                            : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")
                            }`}
                        >
                          Plan
                        </button>
                        <button
                          onClick={() => setCadViewMode("section")}
                          className={`px-2 sm:px-3 py-1 text-sm rounded-md transition-colors ${cadViewMode === "section"
                            ? (darkMode ? "bg-slate-600 text-slate-100 shadow-sm" : "bg-white text-slate-900 shadow-sm")
                            : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")
                            }`}
                        >
                          Section
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Zoom Controls - hidden in fullscreen */}
                {!cadFullscreen && (
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-4">
                    <button
                      onClick={() => setCadZoom((z: number) => Math.max(cadMinZoom, z - 0.1))}
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-200 hover:bg-slate-300"}`}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className={`text-xs sm:text-sm min-w-[45px] sm:min-w-[60px] text-center ${darkMode ? "text-white" : "text-slate-600"}`}>{(cadZoom * 100).toFixed(0)}%</span>
                    <button
                      onClick={() => setCadZoom((z: number) => Math.min(4, z + 0.1))}
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-200 hover:bg-slate-300"}`}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setCadZoom(cadMinZoom > 0 ? cadMinZoom : 1);
                        setCadPanOffset({ x: 0, y: 0 });
                      }}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-200 hover:bg-slate-300"}`}
                    >
                      Fit
                    </button>
                    <div className={`hidden sm:block border-l h-6 mx-1 sm:mx-2 ${darkMode ? "border-slate-600" : "border-slate-300"}`} />
                    <button
                      onClick={() => setCadRotation((r: number) => (r + 90) % 360)}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1 ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-200 hover:bg-slate-300"}`}
                    >
                      <RotateCw className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Rotate</span>
                    </button>
                    <button
                      onClick={() => { setCadPanMode(!cadPanMode); if (!cadPanMode) setCadLineMode(false); }}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1 ${cadPanMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : (darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-200 hover:bg-slate-300")
                        }`}
                    >
                      <Hand className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Pan</span>
                    </button>
                    <button
                      onClick={() => { setCadLineMode(!cadLineMode); if (!cadLineMode) setCadPanMode(false); }}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1 ${cadLineMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : (darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-200 hover:bg-slate-300")
                        }`}
                    >
                      <Ruler className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Line</span>
                    </button>
                    {/* Floor Z button - only in section mode */}
                    {cadViewMode === "section" && (
                      <button
                        onClick={() => {
                          // Toggle visibility, initialize position if needed
                          if (!cadFloorZVisible) {
                            if (!cadFloorZ) {
                              setCadFloorZ({ x: cadPdfSize.width / 2, y: cadPdfSize.height * 0.8 });
                            }
                            setCadFloorZVisible(true);
                          } else {
                            setCadFloorZVisible(false);
                          }
                        }}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1 ${cadFloorZVisible
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : (darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-200 hover:bg-slate-300")
                          }`}
                        title="Toggle floor reference marker"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {/* Vertical line */}
                          <line x1="12" y1="3" x2="12" y2="21" />
                          {/* Top horizontal line */}
                          <line x1="8" y1="3" x2="16" y2="3" />
                          {/* Bottom horizontal line */}
                          <line x1="8" y1="21" x2="16" y2="21" />
                          {/* Top arrow head (pointing up) */}
                          <polyline points="9,7 12,3 15,7" />
                          {/* Bottom arrow head (pointing down) */}
                          <polyline points="9,17 12,21 15,17" />
                        </svg>
                        <span className="hidden sm:inline">Floor Z</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* CAD Canvas Area */}
              <div
                ref={cadContainerRef}
                className={`relative border-2 border-dashed rounded-xl overflow-hidden mb-4 sm:mb-6 ${darkMode ? "border-slate-600 bg-slate-800" : "border-slate-300 bg-slate-100"}`}
                style={{
                  height: "300px",
                  touchAction: "none",
                }}
              >
                {!cadPdfDocument ? (
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }} className={`px-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    <FileUp className="w-12 h-12 mb-3 opacity-50 mx-auto" />
                    <p className="text-lg">Import a PDF CAD drawing to get started</p>
                    <p className="text-sm mt-1">Supports architectural floor plans and venue drawings</p>
                  </div>
                ) : (
                  <>
                    {/* PDF Canvas - centered with absolute positioning */}
                    <canvas
                      ref={cadCanvasRef}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transformOrigin: "center center",
                        transform: `translate(-50%, -50%) translate(${cadPanOffset.x}px, ${cadPanOffset.y}px) scale(${cadZoom}) rotate(${cadRotation}deg)`,
                      }}
                    />
                    {/* Overlay Canvas - centered with absolute positioning */}
                    <canvas
                      ref={cadOverlayRef}
                      className={`${cadPanMode ? "cursor-grab" : "cursor-default"} ${cadIsPanning ? "cursor-grabbing" : ""}`}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transformOrigin: "center center",
                        transform: `translate(-50%, -50%) translate(${cadPanOffset.x}px, ${cadPanOffset.y}px) scale(${cadZoom}) rotate(${cadRotation}deg)`,
                        zIndex: 10,
                        pointerEvents: "auto",
                      }}
                      onMouseDown={(e: React.MouseEvent<HTMLCanvasElement>) => {
                        // Pan mode: start panning
                        if (cadPanMode) {
                          setCadIsPanning(true);
                          setCadPanStart({ x: e.clientX, y: e.clientY });
                          return;
                        }

                        const rect = e.currentTarget.getBoundingClientRect();
                        const { x, y } = screenToCanvasCoords(e.clientX, e.clientY, rect);

                        // Check floor Z handle (in section mode when visible)
                        if (cadViewMode === "section" && cadFloorZ && cadFloorZVisible) {
                          const floorDist = Math.sqrt(
                            Math.pow(x - cadFloorZ.x, 2) + Math.pow(y - cadFloorZ.y, 2)
                          );
                          if (floorDist < 50) {
                            setCadDragging({ type: "floorZ" });
                            return;
                          }
                        }

                        // Check measurement line handles first (if line mode is on)
                        if (cadLineMode) {
                          const startDist = Math.sqrt(
                            Math.pow(x - cadLineMeasurement.start.x, 2) + Math.pow(y - cadLineMeasurement.start.y, 2)
                          );
                          if (startDist < 25) {
                            setCadDragging({ type: "lineStart" });
                            return;
                          }
                          const endDist = Math.sqrt(
                            Math.pow(x - cadLineMeasurement.end.x, 2) + Math.pow(y - cadLineMeasurement.end.y, 2)
                          );
                          if (endDist < 25) {
                            setCadDragging({ type: "lineEnd" });
                            return;
                          }
                        }

                        // Check all projectors and their screens
                        for (const projector of cadProjectors) {
                          const projPos = cadViewMode === "plan" ? projector.planPos : projector.sectionPos;
                          const projDist = Math.sqrt(
                            Math.pow(x - projPos.x, 2) + Math.pow(y - projPos.y, 2)
                          );
                          if (projDist < 35) {
                            setCadSelectedProjector(projector.id);
                            setCadDragging({ type: "projector", projectorId: projector.id });
                            return;
                          }

                          // Check this projector's screen
                          const scrPos = cadViewMode === "plan" ? projector.screenPlanPos : projector.screenSectionPos;
                          const screenDist = Math.sqrt(
                            Math.pow(x - scrPos.x, 2) + Math.pow(y - scrPos.y, 2)
                          );
                          if (screenDist < 35) {
                            setCadSelectedProjector(projector.id);
                            setCadDragging({ type: "screen", projectorId: projector.id });
                            return;
                          }
                        }
                      }}
                      onMouseMove={(e: React.MouseEvent<HTMLCanvasElement>) => {
                        // Pan mode: update pan offset with constraints
                        if (cadIsPanning && cadPanMode) {
                          const dx = (e.clientX - cadPanStart.x) / cadZoom;
                          const dy = (e.clientY - cadPanStart.y) / cadZoom;
                          setCadPanOffset(prev => constrainPanOffset({ x: prev.x + dx, y: prev.y + dy }, cadZoom));
                          setCadPanStart({ x: e.clientX, y: e.clientY });
                          return;
                        }

                        if (!cadDragging) return;

                        const rect = e.currentTarget.getBoundingClientRect();
                        const { x, y } = screenToCanvasCoords(e.clientX, e.clientY, rect);

                        if (cadDragging.type === "floorZ") {
                          const clamped = clampToCanvasBounds(x, y);
                          setCadFloorZ(clamped);
                        } else if (cadDragging.type === "lineStart") {
                          setCadLineMeasurement(prev => ({ ...prev, start: { x, y } }));
                        } else if (cadDragging.type === "lineEnd") {
                          setCadLineMeasurement(prev => ({ ...prev, end: { x, y } }));
                        } else if (cadDragging.type === "projector" && cadDragging.projectorId) {
                          // Update the specific projector's position
                          const clamped = clampToCanvasBounds(x, y);
                          setCadProjectors(prev => prev.map(p => {
                            if (p.id !== cadDragging.projectorId) return p;
                            if (cadViewMode === "plan") {
                              return { ...p, planPos: clamped };
                            } else {
                              return { ...p, sectionPos: clamped };
                            }
                          }));
                        } else if (cadDragging.type === "screen" && cadDragging.projectorId) {
                          // Update the specific projector's screen position
                          const clamped = clampToCanvasBounds(x, y);
                          setCadProjectors(prev => prev.map(p => {
                            if (p.id !== cadDragging.projectorId) return p;
                            if (cadViewMode === "plan") {
                              return { ...p, screenPlanPos: clamped };
                            } else {
                              return { ...p, screenSectionPos: clamped };
                            }
                          }));
                        }
                      }}
                      onMouseUp={() => {
                        setCadDragging(null);
                        setCadIsPanning(false);
                      }}
                      onMouseLeave={() => {
                        setCadDragging(null);
                        setCadIsPanning(false);
                      }}
                      onTouchStart={(e: React.TouchEvent<HTMLCanvasElement>) => {
                        // Two-finger pinch-to-zoom
                        if (e.touches.length === 2) {
                          const touch1 = e.touches[0];
                          const touch2 = e.touches[1];
                          const dist = Math.sqrt(
                            Math.pow(touch2.clientX - touch1.clientX, 2) +
                            Math.pow(touch2.clientY - touch1.clientY, 2)
                          );
                          setCadPinchStartDist(dist);
                          setCadPinchStartZoom(cadZoom);
                          // Also start panning from the midpoint
                          setCadIsPanning(true);
                          setCadPanStart({
                            x: (touch1.clientX + touch2.clientX) / 2,
                            y: (touch1.clientY + touch2.clientY) / 2
                          });
                          return;
                        }

                        const touch = e.touches[0];

                        // Pan mode: start panning
                        if (cadPanMode) {
                          setCadIsPanning(true);
                          setCadPanStart({ x: touch.clientX, y: touch.clientY });
                          return;
                        }

                        const rect = e.currentTarget.getBoundingClientRect();
                        const { x, y } = screenToCanvasCoords(touch.clientX, touch.clientY, rect);

                        // Check floor Z handle (in section mode when visible)
                        if (cadViewMode === "section" && cadFloorZ && cadFloorZVisible) {
                          const floorDist = Math.sqrt(
                            Math.pow(x - cadFloorZ.x, 2) + Math.pow(y - cadFloorZ.y, 2)
                          );
                          if (floorDist < 60) {
                            setCadDragging({ type: "floorZ" });
                            return;
                          }
                        }

                        // Check measurement line handles first (if line mode is on)
                        if (cadLineMode) {
                          const startDist = Math.sqrt(
                            Math.pow(x - cadLineMeasurement.start.x, 2) + Math.pow(y - cadLineMeasurement.start.y, 2)
                          );
                          if (startDist < 35) {
                            setCadDragging({ type: "lineStart" });
                            return;
                          }
                          const endDist = Math.sqrt(
                            Math.pow(x - cadLineMeasurement.end.x, 2) + Math.pow(y - cadLineMeasurement.end.y, 2)
                          );
                          if (endDist < 35) {
                            setCadDragging({ type: "lineEnd" });
                            return;
                          }
                        }

                        // Check all projectors and their screens
                        for (const projector of cadProjectors) {
                          const projPos = cadViewMode === "plan" ? projector.planPos : projector.sectionPos;
                          const projDist = Math.sqrt(
                            Math.pow(x - projPos.x, 2) + Math.pow(y - projPos.y, 2)
                          );
                          if (projDist < 70) {
                            setCadSelectedProjector(projector.id);
                            setCadDragging({ type: "projector", projectorId: projector.id });
                            return;
                          }

                          // Check this projector's screen
                          const scrPos = cadViewMode === "plan" ? projector.screenPlanPos : projector.screenSectionPos;
                          const screenDist = Math.sqrt(
                            Math.pow(x - scrPos.x, 2) + Math.pow(y - scrPos.y, 2)
                          );
                          if (screenDist < 70) {
                            setCadSelectedProjector(projector.id);
                            setCadDragging({ type: "screen", projectorId: projector.id });
                            return;
                          }
                        }
                      }}
                      onTouchMove={(e: React.TouchEvent<HTMLCanvasElement>) => {
                        // Two-finger pinch-to-zoom and pan
                        if (e.touches.length === 2 && cadPinchStartDist !== null) {
                          const touch1 = e.touches[0];
                          const touch2 = e.touches[1];
                          const currentDist = Math.sqrt(
                            Math.pow(touch2.clientX - touch1.clientX, 2) +
                            Math.pow(touch2.clientY - touch1.clientY, 2)
                          );
                          // Calculate zoom based on pinch ratio
                          const scale = currentDist / cadPinchStartDist;
                          const newZoom = Math.min(4, Math.max(cadMinZoom, cadPinchStartZoom * scale));
                          setCadZoom(newZoom);

                          // Also pan based on midpoint movement
                          const midX = (touch1.clientX + touch2.clientX) / 2;
                          const midY = (touch1.clientY + touch2.clientY) / 2;
                          const dx = (midX - cadPanStart.x) / newZoom;
                          const dy = (midY - cadPanStart.y) / newZoom;
                          setCadPanOffset((prev: { x: number; y: number }) => constrainPanOffset({ x: prev.x + dx, y: prev.y + dy }, newZoom));
                          setCadPanStart({ x: midX, y: midY });
                          return;
                        }

                        const touch = e.touches[0];

                        // Pan mode: update pan offset with constraints
                        if (cadIsPanning && cadPanMode) {
                          const dx = (touch.clientX - cadPanStart.x) / cadZoom;
                          const dy = (touch.clientY - cadPanStart.y) / cadZoom;
                          setCadPanOffset(prev => constrainPanOffset({ x: prev.x + dx, y: prev.y + dy }, cadZoom));
                          setCadPanStart({ x: touch.clientX, y: touch.clientY });
                          return;
                        }

                        if (!cadDragging) return;

                        const rect = e.currentTarget.getBoundingClientRect();
                        const { x, y } = screenToCanvasCoords(touch.clientX, touch.clientY, rect);

                        if (cadDragging.type === "floorZ") {
                          const clamped = clampToCanvasBounds(x, y);
                          setCadFloorZ(clamped);
                        } else if (cadDragging.type === "lineStart") {
                          setCadLineMeasurement(prev => ({ ...prev, start: { x, y } }));
                        } else if (cadDragging.type === "lineEnd") {
                          setCadLineMeasurement(prev => ({ ...prev, end: { x, y } }));
                        } else if (cadDragging.type === "projector" && cadDragging.projectorId) {
                          const clamped = clampToCanvasBounds(x, y);
                          setCadProjectors(prev => prev.map(p => {
                            if (p.id !== cadDragging.projectorId) return p;
                            if (cadViewMode === "plan") {
                              return { ...p, planPos: clamped };
                            } else {
                              return { ...p, sectionPos: clamped };
                            }
                          }));
                        } else if (cadDragging.type === "screen" && cadDragging.projectorId) {
                          const clamped = clampToCanvasBounds(x, y);
                          setCadProjectors(prev => prev.map(p => {
                            if (p.id !== cadDragging.projectorId) return p;
                            if (cadViewMode === "plan") {
                              return { ...p, screenPlanPos: clamped };
                            } else {
                              return { ...p, screenSectionPos: clamped };
                            }
                          }));
                        }
                      }}
                      onTouchEnd={() => {
                        setCadDragging(null);
                        setCadIsPanning(false);
                        setCadPinchStartDist(null);
                      }}
                    />

                    {/* Fullscreen Button - bottom right, in its own stacking context */}
                    <div className="absolute bottom-4 right-4" style={{ zIndex: 100, isolation: "isolate" }}>
                      <button
                        onClick={() => setCadFullscreen(true)}
                        className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                        title="Enter Fullscreen"
                        style={{ pointerEvents: "auto" }}
                      >
                        <Maximize2 className="w-5 h-5 text-slate-700" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Projector Controls */}
              {cadPdfDocument && (
                <IOSCard className="mb-6" darkMode={darkMode}>
                  <h3 className={`text-lg mb-4 ${darkMode ? "text-white" : "text-slate-700"}`}>Projector Settings</h3>

                  {/* Projector Selector Tabs */}
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    {cadProjectors.map((proj: CadProjector, idx: number) => {
                      const color = projectorColors[idx % projectorColors.length];
                      const isSelected = proj.id === cadSelectedProjector;
                      return (
                        <div key={proj.id} className="flex items-center">
                          <button
                            onClick={() => setCadSelectedProjector(proj.id)}
                            className={`px-3 py-1.5 text-sm rounded-l transition-colors ${isSelected ? (darkMode ? "bg-slate-700 shadow-sm font-medium text-white" : "bg-white shadow-sm font-medium") : (darkMode ? "bg-slate-600 hover:bg-slate-500 text-slate-200" : "bg-slate-200 hover:bg-slate-300")}`}
                            style={{ borderLeft: `4px solid ${color.fill}` }}
                          >
                            Projector {proj.id}
                          </button>
                          {cadProjectors.length > 1 && (
                            <button
                              onClick={() => removeProjector(proj.id)}
                              className={`px-2 py-1.5 text-sm rounded-r border-l ${darkMode ? "bg-slate-600 hover:bg-red-900 hover:text-red-400 border-[#ffffff4a] text-slate-200" : "bg-slate-200 hover:bg-red-100 hover:text-red-600 border-slate-300"}`}
                              title="Remove projector"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <IOSButton
                      variant="tinted"
                      size="sm"
                      onClick={addProjector}
                    >
                      + Add Projector
                    </IOSButton>
                  </div>

                  {/* Projector from Inventory Selector */}
                  <div className="mb-4">
                    <label className={`block text-sm mb-2 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                      Load from Inventory
                      {cadProjectorBrand && cadProjectorModel && (
                        <span className={`ml-2 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                          (Currently: {cadProjectorBrand} {cadProjectorModel})
                        </span>
                      )}
                    </label>
                    <IOSSelect
                      value={
                        projectorInventory.find(p =>
                          p.brand === cadProjectorBrand && p.model === cadProjectorModel
                        )?.id || "custom"
                      }
                      onChange={(e) => applyInventoryToCadProjector(e.target.value)}
                      options={[
                        { value: "custom", label: "Custom" },
                        ...projectorInventory.map(proj => ({
                          value: proj.id,
                          label: `${proj.brand} ${proj.model} (${proj.lensType === "fixed" ? `${proj.throwRatioMin}:1` : `${proj.throwRatioMin}-${proj.throwRatioMax}:1`}, ${proj.lumens} lm)`
                        }))
                      ]}
                      darkMode={darkMode}
                      size="sm"
                    />
                    {projectorInventory.length === 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        <button
                          onClick={() => setShowInventoryModal(true)}
                          className="text-blue-600 hover:underline"
                        >
                          Add projectors to your inventory
                        </button>
                        {" "}to quickly load settings.
                      </p>
                    )}
                  </div>

                  {/* Lock Mode Toggle */}
                  <div className="flex items-center gap-4 mb-4">
                    <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Lock:</span>
                    <div className={`flex items-center rounded-lg p-1 ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                      <button
                        onClick={() => setCadLockMode("screen")}
                        className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1 ${cadLockMode === "screen"
                          ? (darkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm") : (darkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900")}`}
                      >
                        <Lock className="w-3 h-3" /> Screen
                      </button>
                      <button
                        onClick={() => setCadLockMode("projector")}
                        className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1 ${cadLockMode === "projector"
                          ? (darkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm") : (darkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900")}`}
                      >
                        <Lock className="w-3 h-3" /> Projector
                      </button>
                    </div>
                  </div>

                  {/* Throw Distance Slider */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Throw Distance</span>
                      <span className={`font-medium ${darkMode ? "text-yellow-200" : "text-slate-900"}`}>
                        {(() => {
                          const projPos = cadViewMode === "plan" ? cadProjectorPos : cadSectionProjectorPos;
                          const scrPos = cadViewMode === "plan" ? cadScreenPos : cadSectionScreenPos;
                          const distPx = Math.sqrt(Math.pow(scrPos.x - projPos.x, 2) + Math.pow(scrPos.y - projPos.y, 2));
                          const feetPerInch = cadScaleMode === "architect"
                            ? 1 / (architectScales[cadScale] || 0.25)
                            : parseFloat(cadCustomScale) || 1;
                          const distFeet = (distPx / 108) * feetPerInch;
                          switch (cadUnit) {
                            case "feet": return distFeet.toFixed(2) + " ft";
                            case "inches": return (distFeet * 12).toFixed(1) + " in";
                            case "meters": return (distFeet * 0.3048).toFixed(2) + " m";
                            case "cm": return (distFeet * 30.48).toFixed(1) + " cm";
                            default: return distFeet.toFixed(2) + " ft";
                          }
                        })()}
                      </span>
                    </div>
                    <input
                      type="range" min="50" max="3000" step="5"
                      value={(() => {
                        const projPos = cadViewMode === "plan" ? cadProjectorPos : cadSectionProjectorPos;
                        const scrPos = cadViewMode === "plan" ? cadScreenPos : cadSectionScreenPos;
                        return Math.sqrt(Math.pow(scrPos.x - projPos.x, 2) + Math.pow(scrPos.y - projPos.y, 2));
                      })()}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newDistPx = parseFloat(e.target.value);
                        const projPos = cadViewMode === "plan" ? cadProjectorPos : cadSectionProjectorPos;
                        const scrPos = cadViewMode === "plan" ? cadScreenPos : cadSectionScreenPos;
                        const dx = scrPos.x - projPos.x;
                        const dy = scrPos.y - projPos.y;
                        const currentDist = Math.sqrt(dx * dx + dy * dy);
                        if (currentDist === 0) return;
                        const angle = Math.atan2(dy, dx);
                        if (cadLockMode === "screen") {
                          const newProjX = scrPos.x - Math.cos(angle) * newDistPx;
                          const newProjY = scrPos.y - Math.sin(angle) * newDistPx;
                          setCadProjectorPos({ x: newProjX, y: newProjY });
                        } else {
                          const newScreenX = projPos.x + Math.cos(angle) * newDistPx;
                          const newScreenY = projPos.y + Math.sin(angle) * newDistPx;
                          setCadScreenPos({ x: newScreenX, y: newScreenY });
                        }
                      }}
                      className="w-full"
                    />
                    <div className="text-xs text-slate-500 mt-1">
                      {cadLockMode === "screen" ? "Moving projector" : "Moving screen"}
                    </div>
                  </div>

                  {/* Throw Ratio Slider */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Throw Ratio</span>
                      <span className={`font-medium ${darkMode ? "text-yellow-200" : "text-slate-900"}`}>
                        {cadThrowRatio.toFixed(2)}:1
                        {cadProjectorLensType === "fixed" && " (fixed)"}
                      </span>
                    </div>
                    {cadProjectorLensType === "zoom" ? (
                      <>
                        <input
                          type="range"
                          min={cadProjectorThrowRatioMin}
                          max={cadProjectorThrowRatioMax}
                          step="0.01"
                          value={cadThrowRatio}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCadThrowRatio(parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-slate-400 mt-1 flex justify-between">
                          <span>{cadProjectorThrowRatioMin}:1</span>
                          <span>{cadProjectorThrowRatioMax}:1</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-500">
                        Fixed lens at {cadThrowRatio.toFixed(2)}:1
                      </div>
                    )}
                  </div>

                  {/* Aspect Ratio */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Aspect Ratio</span>
                      <IOSSelect
                        value={cadProjectorAspectRatio}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCadProjectorAspectRatio(e.target.value as "16:9" | "16:10" | "4:3")}
                        options={[
                          { value: "16:9", label: "16:9" },
                          { value: "16:10", label: "16:10" },
                          { value: "4:3", label: "4:3" },
                        ]}
                        darkMode={darkMode}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Lens Shift - Horizontal for Plan, Vertical for Section */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        {cadViewMode === "plan" ? "Horizontal" : "Vertical"} Lens Shift
                      </span>
                      <span className={`font-medium ${darkMode ? "text-yellow-200" : "text-slate-900"}`}>
                        {cadViewMode === "plan" ? cadLensShift : cadVerticalLensShift}%
                      </span>
                    </div>
                    <input
                      type="range" min="-100" max="100" step="1"
                      value={cadViewMode === "plan" ? cadLensShift : cadVerticalLensShift}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const val = parseInt(e.target.value);
                        if (cadViewMode === "plan") {
                          setCadLensShift(val);
                        } else {
                          setCadVerticalLensShift(val);
                        }
                      }}
                      className="w-full"
                    />
                  </div>

                  {/* Screen Yaw (Keystone) */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Screen Yaw</span>
                      <span className={`font-medium ${darkMode ? "text-yellow-200" : "text-slate-900"}`}>{cadScreenYaw}°</span>
                    </div>
                    <input
                      type="range" min="-45" max="45" step="1"
                      value={cadScreenYaw}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCadScreenYaw(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Lumens Input */}
                  <div className="flex items-center gap-4">
                    <label className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Lumens:</label>
                    <IOSInput
                      type="text"
                      value={cadLumens}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCadLumens(e.target.value)}
                      darkMode={darkMode}
                      className="w-32"
                    />
                  </div>
                </IOSCard>
              )}

              {/* Live Stats */}
              {cadPdfDocument && (
                <IOSCard className="mb-6" darkMode={darkMode}>
                  <h3 className={`text-lg mb-3 ${darkMode ? "text-white" : "text-slate-700"}`}>Projection Info ({cadViewMode === "plan" ? "Plan View" : "Section View"})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Throw Distance</div>
                      <div className={`font-medium ${darkMode ? "text-white" : "text-slate-900"}`}>
                        {(() => {
                          const projPos = cadViewMode === "plan" ? cadProjectorPos : cadSectionProjectorPos;
                          const scrPos = cadViewMode === "plan" ? cadScreenPos : cadSectionScreenPos;
                          const dx = scrPos.x - projPos.x;
                          const dy = scrPos.y - projPos.y;
                          const distPx = Math.sqrt(dx * dx + dy * dy);
                          const feetPerInch = cadScaleMode === "architect"
                            ? 1 / (architectScales[cadScale] || 0.25)
                            : parseFloat(cadCustomScale);
                          const distFeet = (distPx / 108) * feetPerInch;
                          switch (cadUnit) {
                            case "feet": return distFeet.toFixed(2) + " ft";
                            case "inches": return (distFeet * 12).toFixed(1) + " in";
                            case "meters": return (distFeet * 0.3048).toFixed(2) + " m";
                            case "cm": return (distFeet * 30.48).toFixed(1) + " cm";
                            default: return distFeet.toFixed(2) + " ft";
                          }
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Throw Ratio</div>
                      <div className={`font-medium ${darkMode ? "text-white" : "text-slate-900"}`}>{cadThrowRatio.toFixed(2)}:1</div>
                    </div>
                    <div>
                      <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Image Width</div>
                      <div className={`font-medium ${darkMode ? "text-white" : "text-slate-900"}`}>
                        {(() => {
                          const projPos = cadViewMode === "plan" ? cadProjectorPos : cadSectionProjectorPos;
                          const scrPos = cadViewMode === "plan" ? cadScreenPos : cadSectionScreenPos;
                          const dx = scrPos.x - projPos.x;
                          const dy = scrPos.y - projPos.y;
                          const distPx = Math.sqrt(dx * dx + dy * dy);
                          const feetPerInch = cadScaleMode === "architect"
                            ? 1 / (architectScales[cadScale] || 0.25)
                            : parseFloat(cadCustomScale);
                          const distFeet = (distPx / 108) * feetPerInch;
                          const widthFeet = distFeet / cadThrowRatio;
                          switch (cadUnit) {
                            case "feet": return widthFeet.toFixed(2) + " ft";
                            case "inches": return (widthFeet * 12).toFixed(1) + " in";
                            case "meters": return (widthFeet * 0.3048).toFixed(2) + " m";
                            case "cm": return (widthFeet * 30.48).toFixed(1) + " cm";
                            default: return widthFeet.toFixed(2) + " ft";
                          }
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Brightness (fL)</div>
                      <div className={`font-medium ${darkMode ? "text-white" : "text-slate-900"}`}>
                        {(() => {
                          const projPos = cadViewMode === "plan" ? cadProjectorPos : cadSectionProjectorPos;
                          const scrPos = cadViewMode === "plan" ? cadScreenPos : cadSectionScreenPos;
                          const dx = scrPos.x - projPos.x;
                          const dy = scrPos.y - projPos.y;
                          const distPx = Math.sqrt(dx * dx + dy * dy);
                          const feetPerInch = cadScaleMode === "architect"
                            ? 1 / (architectScales[cadScale] || 0.25)
                            : parseFloat(cadCustomScale);
                          const distFeet = (distPx / 108) * feetPerInch;
                          const width = distFeet / cadThrowRatio;
                          const aspectRatios: Record<string, { w: number; h: number }> = {
                            "16:9": { w: 16, h: 9 },
                            "16:10": { w: 16, h: 10 },
                            "4:3": { w: 4, h: 3 },
                          };
                          const aspect = aspectRatios[cadAspectRatio] || aspectRatios["16:9"];
                          const height = width * aspect.h / aspect.w;
                          const area = width * height;
                          const fl = parseFloat(cadLumens) / area;
                          return fl.toFixed(1) + " fL";
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Hanging Height - only in section mode when floor Z is set */}
                  {cadViewMode === "section" && cadFloorZ !== null && (
                    <div className={`mt-4 pt-4 border-t ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
                      <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Projector Hanging Height</div>
                      <div className={`font-medium ${darkMode ? "text-white" : "text-slate-900"}`}>
                        {(() => {
                          // Get PDF positions
                          const projX = cadSectionProjectorPos.x;
                          const projY = cadSectionProjectorPos.y;
                          const floorX = cadFloorZ.x;
                          const floorY = cadFloorZ.y;

                          // Convert to positions relative to PDF center
                          const projRelX = projX - cadPdfSize.width / 2;
                          const projRelY = projY - cadPdfSize.height / 2;
                          const floorRelX = floorX - cadPdfSize.width / 2;
                          const floorRelY = floorY - cadPdfSize.height / 2;

                          // Apply rotation to get view-space positions
                          const radians = (cadRotation * Math.PI) / 180;
                          const cos = Math.cos(radians);
                          const sin = Math.sin(radians);

                          // Projector view Y (rotated)
                          const projViewY = projRelX * sin + projRelY * cos;
                          // Floor view Y (rotated)
                          const floorViewY = floorRelX * sin + floorRelY * cos;

                          // Height is floor Y minus projector Y (floor is below, higher Y in screen space)
                          // Positive when projector is above floor (projector has smaller view Y)
                          const heightPx = floorViewY - projViewY;

                          const feetPerInch = cadScaleMode === "architect"
                            ? 1 / (architectScales[cadScale] || 0.25)
                            : parseFloat(cadCustomScale);
                          const heightFeet = (heightPx / 108) * feetPerInch;
                          switch (cadUnit) {
                            case "feet": return heightFeet.toFixed(2) + " ft";
                            case "inches": return (heightFeet * 12).toFixed(1) + " in";
                            case "meters": return (heightFeet * 0.3048).toFixed(2) + " m";
                            case "cm": return (heightFeet * 30.48).toFixed(1) + " cm";
                            default: return heightFeet.toFixed(2) + " ft";
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </IOSCard>
              )}

              {/* Export Button */}
              {cadPdfDocument && (
                <IOSButton
                  variant="filled"
                  color="green"
                  fullWidth
                  onClick={generateCadPDF}
                  icon={<Download className="w-4 h-4" />}
                >
                  Export Annotated PDF
                </IOSButton>
              )}
            </>
          </div>
        )
      }
    </div >
  );
}