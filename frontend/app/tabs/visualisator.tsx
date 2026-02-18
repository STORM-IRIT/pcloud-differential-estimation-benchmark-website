"use client";

import * as React from "react";
import { useState, useMemo, useEffect, useCallback, useRef, forwardRef } from "react";
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { OrbitControls } from 'three-stdlib';
import { BufferGeometry, Float32BufferAttribute, Color, ShaderMaterial, Vector3, Vector2, PerspectiveCamera, Quaternion, Object3D } from 'three';
import { interpolateViridis, interpolateRgbBasis, scaleSequential } from 'd3';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { Button } from "../components/ui/button";
import { Menu, Loader2, Info, ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { Separator } from "../components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";

const isProd: boolean = process.env.NODE_ENV === 'production';
const isStatic: boolean = process.env.STATIC_BUILD === 'true';
const repoName: string = 'pcloud-differential-estimation-benchmark-website';

const datasets: string[] = ['DGtal', 'DGtal_helios', 'ABC', 'ABC_helios', 'PCPNet'];

// const shapes: { [key: string]: string[] } = {
//   'CAD': ['0033', '0614', '4163', '4227', '4449', '0255', '0679', '4194', '4257', '4913'],
//   'CAD_helios': ['0033', '0614', '4163', '4227', '4449', '0255', '0679', '4194', '4257', '4913'],
//   'DGtal': ['cylinder', 'ellipsoid', 'goursat', 'goursat-hole', 'hyperboloid', 'paraboloid', 'saddle', 'torus', 'tube'],
//   'DGtal_helios': ['cylinder', 'ellipsoid', 'goursat', 'goursat-hole', 'hyperboloid', 'paraboloid', 'saddle', 'torus', 'tube'],
//   'PCPNet': ['Cup34100k', 'cylinder100k', 'pipe100k', 'Liberty100k', 'galera100k', 'sphere100k', 'boxunion2100k', 'icosahedron100k', 'column100k', 'netsuke100k', 'Boxy_smooth100k', 'pipe_curve100k', 'sphere_analytic100k', 'star_smooth100k', 'cylinder_analytic100k', 'sheet_analytic100k', 'star_halfsmooth100k', 'column_head100k', 'star_sharp100k']
// };
const shapes: { [key: string]: string[] } = {
  'ABC': ['4227', '0255', '4194'],
  'ABC_helios': ['4227', '0255', '4194'],
  'DGtal': [ 'goursat-hole', 'saddle', 'torus'],
  'DGtal_helios': [ 'goursat-hole', 'saddle', 'torus'],
  'PCPNet': ['Liberty100k', 'netsuke100k', 'column100k']
};

const methods_mean: string[] = ['Ground Truth', 'Mean', 'Cov2D', 'NormCov2D', 'NormCov3D', 'ShapeOperator', '2-Monge', 'PC-MLS', 'JetFitting', 'WaveJets', 'Sphere', 'APSS', 'UnorientedSphere', 'ASO', '3DQuadric', 'Varifolds', 'AvgHexagram'];
const methods_gauss: string[] = ['Ground Truth', 'Cov2D', 'NormCov2D', 'NormCov3D', 'ShapeOperator', '2-Monge', 'JetFitting', 'WaveJets', 'ASO', '3DQuadric', 'Varifolds', 'AvgHexagram'];

const radii: string[] = ['0.075', '0.1', '0.2'];

const quantities: string[] = ['Mean Curvature', 'Gaussian Curvature'];

const quantities_map : { [key: string]: string } = {
  'Mean Curvature': 'kMean',
  'Gaussian Curvature': 'kGauss'
};

const methods_indices: { [key: string]: number } = {
  'Ground Truth':3,
  'Mean':4,
  'Cov2D':5,
  'NormCov2D':6,
  'NormCov3D':7,
  'ShapeOperator':8,
  'PCA':9,
  '2-Monge':10,
  'PC-MLS':11,
  'JetFitting':12,
  'WaveJets':13,
  'Sphere':14,
  'APSS':15,
  'UnorientedSphere':16,
  'ASO':17,
  '3DQuadric':18,
  'Varifolds':19,
  'AvgHexagram':20,
}

const getPath = (dataset: string, error: boolean, quantity: string, radius: string, filename: string): string => {
  const current_dataset: string = dataset === 'ABC' ? 'CAD' : dataset === 'ABC_helios' ? 'CAD_helios' : dataset;
  const base: string = isProd && !isStatic ? `/${repoName}` : '';
  const type: string = error ? 'errors' : 'estims';
  return `${base}/data/${radius}/${type}/${current_dataset}/${quantities_map[quantity]}/${filename}.json`;
};

const getIndexMethod = (method: string): number => methods_indices[method] || 3;

interface CameraState {
  position: Vector3;
  target: Vector3;
  quaternion: Quaternion;
}

interface DoubleSliderProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  displayError: boolean;
  onValueChange: (value: [number, number]) => void;
  disabled: boolean;
  onDoubleClick: () => void;
}

interface CreatePointCloudProps {
  pointCloud: number[][];
  index_method: number;
  pointSize: number;
  colorRange: [number, number];
  displayError: boolean;
}

interface SynchronizedOrbitControlsProps {
  isLeft: boolean;
  onControlsChange: (isLeft: boolean, controls: OrbitControls | null) => void;
}

interface PointCloudCanvasProps {
  isMobile?: boolean;
  name: string;
  pointCloudData: number[][];
  pointSize: number;
  colorRange: [number, number];
  isLeft: boolean;
  onControlsChange: (isLeft: boolean, controls: OrbitControls | null) => void;
  index_method: number;
  displayError: boolean;
  cameraStateRef: React.MutableRefObject<CameraState | null>;
}

interface ConfigPanelProps {
  selectedDataset: string;
  setSelectedDataset: (dataset: string) => void;
  selectedShape: string;
  setSelectedShape: (shape: string) => void;
  selectedLeft: string;
  setSelectedLeft: (method: string) => void;
  displayLeftError: boolean;
  setDisplayLeftError: (display: boolean) => void;
  selectedRight: string;
  setSelectedRight: (method: string) => void;
  displayRightError: boolean;
  setDisplayRightError: (display: boolean) => void;
  selectedQuantity: string;
  setSelectedQuantity: (quantity: string) => void;
  pointSize: number;
  setPointSize: (size: number) => void;
  isLoading: boolean;
  colorRangeLeft: [number, number];
  setColorRangeLeft: (range: [number, number]) => void;
  colorRangeRight: [number, number];
  setColorRangeRight: (range: [number, number]) => void;
  globalMin: number;
  globalMax: number;
  leftRadius: string;
  setLeftRadius: (radius: string) => void;
  rightRadius: string;
  setRightRadius: (radius: string) => void;
  onCopyLeftToRight: () => void;
  onCopyRightToLeft: () => void;
  squeezeColorRange: (isLeft: boolean) => void;
}

interface VisualisatorProps extends React.HTMLAttributes<HTMLDivElement> {}

import * as SliderPrimitive from "@radix-ui/react-slider";

function clampMinMaxPositive(minData: number, maxData: number, clamp: number = 500) {
  let minClamped = minData;
  let maxClamped = maxData;
  let wasClamped = false;

  if (maxData > clamp) {
    maxClamped = clamp;
    wasClamped = true;
  }

  if (minData > clamp) {
    minClamped = clamp;
    wasClamped = true;
  }

  if (minClamped === maxClamped) {
    maxClamped = minClamped + 1e-6;
  }

  return { minClamped, maxClamped, wasClamped };
}

function createClampedGradient(colors: string[], min: number, max: number, vmin: number, vmax: number): string {
  const scale = scaleSequential(interpolateRgbBasis(colors)).domain([min, max]);
  const steps: number = 30;
  const gradientParts: string[] = [];

  let normalizedMin: number = (vmin - min) / (max - min);
  let normalizedMax: number = (vmax - min) / (max - min);
  normalizedMin = Math.max(0, Math.min(1, normalizedMin));
  normalizedMax = Math.max(0, Math.min(1, normalizedMax));

  if (normalizedMin > 0) {
    gradientParts.push(`${scale(min)} 0%`, `${scale(min)} ${normalizedMin * 100}%`);
  }

  for (let i = 0; i <= steps; i++) {
    const stepSize: number = i / steps;
    const val: number = min + stepSize * (max - min);
    const pct: number = (normalizedMin + stepSize * (normalizedMax - normalizedMin)) * 100;
    gradientParts.push(`${scale(val)} ${pct}%`);
  }

  if (normalizedMax < 1) {
    gradientParts.push(`${scale(max)} ${normalizedMax * 100}%`, `${scale(max)} 100%`);
  }

  return `linear-gradient(to right, ${gradientParts.join(", ")})`;
}
const DoubleSlider: React.FC<DoubleSliderProps> = ({ min, max, step, value, displayError, onValueChange, disabled, onDoubleClick }) => {
  const colorMapError: string[] = ["#440154", "#39568C", "#238A8D", "#1F968B", "#55C667", "#FDE725"];
  const colorMapEstim: string[] = ["#f8f1f1ff", "#f7816d", "#b40426"];

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleValueChange = (newValues: number[]): void => {
    if (newValues.length >= 2) {
      onValueChange([newValues[0], newValues[1]]);
    }
  };

  const handleDoubleClickValue = (idx: number) => {
    setEditingIndex(idx);
    setEditValue(value[idx].toFixed(3));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const commitInput = () => {
    if (editingIndex === null) return;
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      const newValues: [number, number] = [...value] as [number, number];
      newValues[editingIndex] = clamped;
      onValueChange(newValues);
    }
    setEditingIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitInput();
    } else if (e.key === "Escape") {
      setEditingIndex(null);
    }
  };

  return (
    <div className="relative w-full space-y-1">
      <div className="relative h-5 rounded overflow-hidden cursor-pointer" onDoubleClick={onDoubleClick}>
        <div
          className="absolute h-full w-full"
          style={{
            backgroundImage: createClampedGradient(
              displayError ? colorMapError : colorMapEstim,
              min, max, value[0], value[1]
            ),
          }}
        />
      </div>

      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center"
        min={min}
        max={max}
        step={step}
        value={[value[0], value[1]]}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {value.map((_: number, idx: number) => (
          <SliderPrimitive.Thumb
            key={idx}
            className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Root>

      <div className="flex justify-between text-xs font-medium text-muted-foreground mt-2">
        {value.map((val, idx) => (
          <span key={idx} onDoubleClick={() => handleDoubleClickValue(idx)}>
            {editingIndex === idx ? (
              <input
                type="number"
                value={editValue}
                onChange={handleInputChange}
                onBlur={commitInput}
                onKeyDown={handleKeyDown}
                className="w-16 text-xs border rounded px-1"
                autoFocus
              />
            ) : (
              val.toFixed(3)
            )}
          </span>
        ))}
        <span className="absolute left-1/2 transform -translate-x-1/2">
          {displayError ? "RMS Error" : "Absolute Estimation"}
        </span>
      </div>
    </div>
  );
};

const CreatePointCloud: React.FC<CreatePointCloudProps> = ({ pointCloud, index_method, pointSize, colorRange, displayError }) => {
  const vertices = new Float32Array(pointCloud.length * 3);
  const scalars = new Float32Array(pointCloud.length);
  const color_index: number = index_method === -1 ? 3 : index_method;

  for (let i = 0; i < pointCloud.length; i++) {
    vertices[i * 3] = pointCloud[i][0];
    vertices[i * 3 + 1] = pointCloud[i][1];
    vertices[i * 3 + 2] = pointCloud[i][2];
    scalars[i] = Math.abs(pointCloud[i][color_index]);
  }
  const geometry = useMemo(() => {
    const geom = new BufferGeometry();
    const colorArray = new Float32Array(vertices.length);
    
    const colorMapError: string[] = ["#440154", "#39568C", "#238A8D", "#1F968B", "#55C667", "#FDE725"];
    const colorMapEstim: string[] = ["#f8f1f1ff", "#f7816d", "#b40426"];
    const colorScale = displayError
      ? scaleSequential(interpolateViridis).domain(colorRange)
      : scaleSequential(interpolateRgbBasis(colorMapEstim)).domain(colorRange);

    for (let i = 0; i < scalars.length; i++) {
      const c = new Color(colorScale(scalars[i]));
      colorArray[i * 3] = c.r;
      colorArray[i * 3 + 1] = c.g;
      colorArray[i * 3 + 2] = c.b;
    }

    geom.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geom.setAttribute('color', new Float32BufferAttribute(colorArray, 3));
    return geom;
  }, [vertices, scalars, colorRange, displayError]);

  const material = useMemo(() => new ShaderMaterial({
    uniforms: {
      pointSize: { value: pointSize },
      resolution: { value: new Vector2(window.innerWidth, window.innerHeight) }
    },
    vertexShader: `
      attribute vec3 color;
      varying vec3 vColor;
      uniform float pointSize;
      uniform vec2 resolution;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = max(1.0, pointSize * (resolution.y / abs(mvPosition.z)));
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        if (dot(cxy, cxy) > 1.0) discard;
        gl_FragColor = vec4(pow(vColor, vec3(1.0/2.2)), 1.0);
      }
    `,
    depthTest: true,
    transparent: true
  }), [pointSize]);

  return <points geometry={geometry} material={material} />;
};

function SynchronizedOrbitControls({ isLeft, onControlsChange }: SynchronizedOrbitControlsProps): JSX.Element {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  useFrame(() => controlsRef.current?.update());

  useEffect(() => {
    if (controlsRef.current) onControlsChange(isLeft, controlsRef.current);
  }, [isLeft, onControlsChange]);

  return (
    <DreiOrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      onChange={() => onControlsChange(isLeft, controlsRef.current)}
    />
  );
}

function PointCloudCanvas({ isMobile = false, name, pointCloudData, pointSize, colorRange, isLeft, onControlsChange, index_method, displayError, cameraStateRef }: PointCloudCanvasProps): JSX.Element {
  const myHeight: string = isMobile ? 'calc(50vh - 100px)' : 'calc(100vh - 100px)';
  
  const camera = useMemo(() => {
    const defaultCamera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    if (cameraStateRef.current) {
      defaultCamera.position.copy(cameraStateRef.current.position);
      defaultCamera.quaternion.copy(cameraStateRef.current.quaternion);
    } else {
      defaultCamera.position.set(0, 0, 5);
    }
    return defaultCamera;
  }, [cameraStateRef]);

  return (
    <div style={{ width: '100%', height: myHeight, position: 'relative' }}>
      <div style={{ position: 'absolute', textAlign: 'left', zIndex: 2, pointerEvents: 'none' }}>
        <p className="p-2 top-0 left-0 font-bold text-1xl text-muted-foreground">{name}</p>
      </div>

      <Canvas camera={camera} className="z-0">
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 5, 5]} intensity={1} />
        {pointCloudData.length > 0 && (
          <CreatePointCloud
            pointCloud={pointCloudData}
            index_method={index_method}
            pointSize={pointSize}
            colorRange={colorRange}
            displayError={displayError}
          />
        )}
        <hemisphereLight groundColor="red" />
        <SynchronizedOrbitControls isLeft={isLeft} onControlsChange={onControlsChange} />
      </Canvas>
    </div>
  );
}

const ConfigPanel = React.memo<ConfigPanelProps>(({
  selectedDataset, setSelectedDataset, selectedShape, setSelectedShape,
  selectedLeft, setSelectedLeft, displayLeftError, setDisplayLeftError,
  selectedRight, setSelectedRight, displayRightError, setDisplayRightError,
  selectedQuantity, setSelectedQuantity, pointSize, setPointSize, isLoading,
  colorRangeLeft, setColorRangeLeft, colorRangeRight, setColorRangeRight,
  globalMin, globalMax, leftRadius, setLeftRadius, rightRadius, setRightRadius,
  onCopyLeftToRight, onCopyRightToLeft, squeezeColorRange
}) => {
  const handleLeftDoubleClick = (): void => setColorRangeLeft([globalMin, globalMax]);
  const handleRightDoubleClick = (): void => setColorRangeRight([globalMin, globalMax]);

  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <h2 className="text-2xl font-bold flex items-center gap-4">
        Configuration
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help inline-flex items-center justify-center">
                <Info className="h-7 w-7 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center" sideOffset={10} className="w-80">
              <p className="text-sm">
                Configure the dataset, methods and quantity. <br/>
                Use arrow buttons at the right of the colorbars to sync color ranges. <br/>
                Double-click colormap to squeeze to the self data range. <br/>
                Double-click min/max values to edit them. <br/>
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h2>
      <Separator />
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Dataset</label>
          <Select value={selectedDataset} onValueChange={setSelectedDataset} disabled={isLoading}>
            <SelectTrigger><SelectValue placeholder="Dataset" /></SelectTrigger>
            <SelectContent>
              {datasets.map((dataset: string, index: number) => (
                <SelectItem key={index} value={dataset}>{dataset}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Shape</label>
          <Select value={selectedShape} onValueChange={setSelectedShape} disabled={isLoading}>
            <SelectTrigger><SelectValue placeholder="Shape" /></SelectTrigger>
            <SelectContent>
              {shapes[selectedDataset].map((shape: string, index: number) => (
                <SelectItem key={index} value={shape}>{shape}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Quantity</label>
          <Select value={selectedQuantity} onValueChange={setSelectedQuantity} disabled={isLoading}>
            <SelectTrigger><SelectValue placeholder="Quantity" /></SelectTrigger>
            <SelectContent>
              {quantities.map((quantity: string, index: number) => (
                <SelectItem key={index} value={quantity}>{quantity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Left method</label>
          <div className="flex items-center space-x-2 mb-3">
            <Select value={leftRadius} onValueChange={setLeftRadius} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Scale" /></SelectTrigger>
              <SelectContent>
                {radii.map((rad: string, index: number) => (
                  <SelectItem key={index} value={rad}>r={rad}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLeft} onValueChange={setSelectedLeft} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Estimation" /></SelectTrigger>
              <SelectContent>
                {(selectedQuantity === "Mean Curvature" ? methods_mean : methods_gauss)
                  .filter(model => !(selectedDataset === "ABC" || selectedDataset === "ABC_helios") || model !== "Ground Truth")
                  .map((model: string, index: number) => (
                    <SelectItem key={index} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={displayLeftError ? "true" : "false"} onValueChange={(value: string) => setDisplayLeftError(value === "true")} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Display" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Estimation</SelectItem>
                {selectedLeft !== "Ground Truth" && !(selectedDataset === "ABC" || selectedDataset === "ABC_helios") && (
                  <SelectItem value="true">Error</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <DoubleSlider
                displayError={displayLeftError}
                min={globalMin}
                max={globalMax}
                step={0.001}
                value={colorRangeLeft}
                onValueChange={setColorRangeLeft}
                disabled={isLoading}
                onDoubleClick={() => squeezeColorRange(true)}
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onCopyLeftToRight}
              disabled={isLoading}
              className="h-8 w-8 shrink-0"
              title="Copy color range to right shape"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Right method</label>
          <div className="flex items-center space-x-2 mb-3">
            <Select value={rightRadius} onValueChange={setRightRadius} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Radius" /></SelectTrigger>
              <SelectContent>
                {radii.map((rad: string, index: number) => (
                  <SelectItem key={index} value={rad}>r={rad}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRight} onValueChange={setSelectedRight} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Estimation" /></SelectTrigger>
              <SelectContent>
                {(selectedQuantity === "Mean Curvature" ? methods_mean : methods_gauss)
                  .filter(model => !(selectedDataset === "ABC" || selectedDataset === "ABC_helios") || model !== "Ground Truth")
                  .map((model: string, index: number) => (
                    <SelectItem key={index} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={displayRightError ? "true" : "false"} onValueChange={(value: string) => setDisplayRightError(value === "true")} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Display" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Estimation</SelectItem>
                {selectedRight !== "Ground Truth" && !(selectedDataset === "ABC" || selectedDataset === "ABC_helios") && (
                  <SelectItem value="true">Error</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <DoubleSlider
                displayError={displayRightError}
                min={globalMin}
                max={globalMax}
                step={0.001}
                value={colorRangeRight}
                onValueChange={setColorRangeRight}
                disabled={isLoading}
                onDoubleClick={() => squeezeColorRange(false)}
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onCopyRightToLeft}
              disabled={isLoading}
              className="h-8 w-8 shrink-0"
              title="Copy color range to left shape"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3 mt-2">Point Size</label>
          <Slider
            min={0.001}
            max={0.05}
            step={0.0005}
            value={[pointSize]}
            onValueChange={(value: number[]) => setPointSize(value[0])}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
});

ConfigPanel.displayName = 'ConfigPanel';

const VisualisatorContent: React.FC<VisualisatorProps> = ({ className, ...props }) => {
  const [selectedDataset, setSelectedDataset] = useState<string>(datasets[0]);
  const [selectedShape, setSelectedShape] = useState<string>(shapes[selectedDataset][0]);
  const [selectedLeft, setSelectedLeft] = useState<string>(methods_mean[0]);
  const [selectedRight, setSelectedRight] = useState<string>(methods_mean[7]);
  const [displayLeftError, setDisplayLeftError] = useState<boolean>(false);
  const [displayRightError, setDisplayRightError] = useState<boolean>(false);
  const [selectedQuantity, setSelectedQuantity] = useState<string>(quantities[0]);
  const [pointSize, setPointSize] = useState<number>(0.01);
  const [pointCloudDataLeft, setPointCloudDataLeft] = useState<number[][]>([]);
  const [pointCloudDataRight, setPointCloudDataRight] = useState<number[][]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [minMaxLeft, setMinMaxLeft] = useState<[number, number]>([0, 10]);
  const [minMaxRight, setMinMaxRight] = useState<[number, number]>([0, 10]);
  const [colorRangeLeft, setColorRangeLeft] = useState<[number, number]>([0, 10]);
  const [colorRangeRight, setColorRangeRight] = useState<[number, number]>([0, 10]);
  const [leftRadius, setLeftRadius] = useState<string>(radii[0]);
  const [rightRadius, setRightRadius] = useState<string>(radii[0]);

  const cameraStateRef = useRef<CameraState | null>(null);
  const leftControlsRef = useRef<OrbitControls | null>(null);
  const rightControlsRef = useRef<OrbitControls | null>(null);
  const isUpdatingRef = useRef<boolean>(false);

  const globalMin: number = Math.min(minMaxLeft[0], minMaxRight[0]);
  const globalMax: number = Math.max(minMaxLeft[1], minMaxRight[1]);

  const getMinMaxValues = useCallback((data: number[][], index: number): [number, number] => {
    if (data.length === 0) return [0, 0];
    
    const values: number[] = data
      .map((point: number[]) => point[index])
      .filter((value: number) => typeof value === "number" && !isNaN(value));

    if (values.length === 0) return [0, 0];
    
    const limitedValues: number[] = values.slice(0, 100000);
    return [Math.min(...limitedValues), Math.max(...limitedValues)];
  }, []);

  const updateMinMaxValues = useCallback((): void => {
      if (pointCloudDataLeft.length === 0 || pointCloudDataRight.length === 0) return;

      const [minLeftData, maxLeftData] = getMinMaxValues(pointCloudDataLeft, getIndexMethod(selectedLeft));
      const [minRightData, maxRightData] = getMinMaxValues(pointCloudDataRight, getIndexMethod(selectedRight));

      const { minClamped: minLeft, maxClamped: maxLeft, wasClamped: clampedLeft } =
        clampMinMaxPositive(minLeftData, maxLeftData, 100000000);
      const { minClamped: minRight, maxClamped: maxRight, wasClamped: clampedRight } =
        clampMinMaxPositive(minRightData, maxRightData, 100000000);

      const epsilon = 0.0001;
      
      setMinMaxLeft((prevMinMax: [number, number]) => {
        const hasChanged = Math.abs(prevMinMax[0] - minLeft) > epsilon || Math.abs(prevMinMax[1] - maxLeft) > epsilon;
        if (hasChanged) {
          requestAnimationFrame(() => {
            setColorRangeLeft((prevRange: [number, number]) => {
              const wasAtExtremum =
                Math.abs(prevRange[0] - prevMinMax[0]) < epsilon &&
                Math.abs(prevRange[1] - prevMinMax[1]) < epsilon;
              if (wasAtExtremum) {
                return [minLeft, maxLeft];
              }
              return prevRange;
            });
          });
          return [minLeft, maxLeft];
        }
        return prevMinMax;
      });

      setMinMaxRight((prevMinMax: [number, number]) => {
        const hasChanged = Math.abs(prevMinMax[0] - minRight) > epsilon || Math.abs(prevMinMax[1] - maxRight) > epsilon;
        if (hasChanged) {
          requestAnimationFrame(() => {
            setColorRangeRight((prevRange: [number, number]) => {
              const wasAtExtremum =
                Math.abs(prevRange[0] - prevMinMax[0]) < epsilon &&
                Math.abs(prevRange[1] - prevMinMax[1]) < epsilon;
              if (wasAtExtremum) {
                return [minRight, maxRight];
              }
              return prevRange;
            });
          });
          return [minRight, maxRight];
        }
        return prevMinMax;
      });

      if (clampedLeft || clampedRight) {
        console.warn("⚠ Clamp appliqué à 500", {
          left: [minLeftData, maxLeftData],
          right: [minRightData, maxRightData],
        });
      }
    }, [pointCloudDataLeft, pointCloudDataRight, selectedLeft, selectedRight, getMinMaxValues]);

  useEffect(() => {
    updateMinMaxValues();
  }, [pointCloudDataLeft, pointCloudDataRight, selectedLeft, selectedRight]);

  const squeezeColorRange = useCallback((isLeft: boolean) => {
    if (isLeft && pointCloudDataLeft.length > 0) {
      const index = getIndexMethod(selectedLeft);
      const values = pointCloudDataLeft.map(p => p[index]).filter(v => !isNaN(v));
      if (values.length > 0) {
        var min_value = Math.min(...values);
        var max_value = Math.max(...values);
        min_value = Math.max(min_value, globalMin);
        max_value = Math.min(max_value, 100000000);
        setColorRangeLeft([min_value, max_value]);
      }
    } else if (!isLeft && pointCloudDataRight.length > 0) {
      const index = getIndexMethod(selectedRight);
      const values = pointCloudDataRight.map(p => p[index]).filter(v => !isNaN(v));
      if (values.length > 0) {
        var min_value = Math.min(...values);
        var max_value = Math.max(...values);
        min_value = Math.max(min_value, globalMin);
        max_value = Math.min(max_value, 100000000);
        setColorRangeRight([min_value, max_value]);
      }
    }
  }, [pointCloudDataLeft, pointCloudDataRight, selectedLeft, selectedRight]);

  const loadPointCloudData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const leftPath: string = getPath(selectedDataset, displayLeftError, selectedQuantity, leftRadius, selectedShape);
      const rightPath: string = getPath(selectedDataset, displayRightError, selectedQuantity, rightRadius, selectedShape);

      const [leftResponse, rightResponse] = await Promise.all([fetch(leftPath), fetch(rightPath)]);

      if (!leftResponse.ok || !rightResponse.ok) {
        throw new Error(`HTTP error! status: ${leftResponse.status} or ${rightResponse.status}`);
      }

      const leftData: number[][] = await leftResponse.json();
      const rightData: number[][] = await rightResponse.json();

      setPointCloudDataLeft(leftData);
      setPointCloudDataRight(rightData);

      if (cameraStateRef.current) {
        [leftControlsRef, rightControlsRef].forEach((ref: React.MutableRefObject<OrbitControls | null>) => {
          if (ref.current) {
            ref.current.object.position.copy(cameraStateRef.current!.position);
            ref.current.target.copy(cameraStateRef.current!.target);
            ref.current.object.quaternion.copy(cameraStateRef.current!.quaternion);
            ref.current.update();
          }
        });
      }
    } catch (error) {
      console.error("Error loading point cloud data:", error);
      setPointCloudDataLeft([]);
      setPointCloudDataRight([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDataset, selectedShape, selectedQuantity, displayLeftError, displayRightError, leftRadius, rightRadius]);

  useEffect(() => {
    const checkIsMobile = (): void => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    setSelectedShape(shapes[selectedDataset][0]);
  }, [selectedDataset]);

  useEffect(() => {
    loadPointCloudData();
  }, [selectedShape, selectedQuantity, displayLeftError, displayRightError, leftRadius, rightRadius, loadPointCloudData]);

  useEffect(() => {
    if (selectedDataset === "CAD" || selectedDataset === "CAD_helios") {
      if (selectedLeft === "Ground Truth") setSelectedLeft(methods_mean[3]);
      if (selectedRight === "Ground Truth") setSelectedRight(methods_mean[3]);
      setDisplayLeftError(false);
      setDisplayRightError(false);
    }
  }, [selectedDataset]);

  const handleControlsChange = useCallback((isLeft: boolean, controls: OrbitControls | null): void => {
    if (isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    if (controls) {
      cameraStateRef.current = {
        position: controls.object.position.clone(),
        target: controls.target.clone(),
        quaternion: controls.object.quaternion.clone(),
      };
    }

    if (isLeft) {
      leftControlsRef.current = controls;
    } else {
      rightControlsRef.current = controls;
    }

    if (leftControlsRef.current && rightControlsRef.current) {
      const sourceControls: OrbitControls = isLeft ? leftControlsRef.current : rightControlsRef.current;
      const targetControls: OrbitControls = isLeft ? rightControlsRef.current : leftControlsRef.current;

      targetControls.target.copy(sourceControls.target);
      targetControls.object.position.copy(sourceControls.object.position);
      targetControls.object.quaternion.copy(sourceControls.object.quaternion);
      targetControls.update();
    }

    isUpdatingRef.current = false;
  }, []);

  const handleLeftChange = useCallback((newEstimation: string): void => {
    if ((selectedDataset === "CAD" || selectedDataset === "CAD_helios") && newEstimation === "Ground Truth") return;
    setSelectedLeft(newEstimation);
    if (newEstimation === "Ground Truth") setDisplayLeftError(false);
  }, [selectedDataset]);

  const handleRightChange = useCallback((newEstimation: string): void => {
    if ((selectedDataset === "CAD" || selectedDataset === "CAD_helios") && newEstimation === "Ground Truth") return;
    setSelectedRight(newEstimation);
    if (newEstimation === "Ground Truth") setDisplayRightError(false);
  }, [selectedDataset]);

  const handleDisplayLeftError = useCallback((newDisplay: boolean): void => {
    if (selectedLeft === "Ground Truth" && newDisplay) return;
    setDisplayLeftError(newDisplay);
  }, [selectedLeft]);

  const handleDisplayRightError = useCallback((newDisplay: boolean): void => {
    if (selectedRight === "Ground Truth" && newDisplay) return;
    setDisplayRightError(newDisplay);
  }, [selectedRight]);

  const handleCopyLeftToRight = useCallback((): void => {
    setColorRangeRight([colorRangeLeft[0], colorRangeLeft[1]]);
  }, [colorRangeLeft]);

  const handleCopyRightToLeft = useCallback((): void => {
    setColorRangeLeft([colorRangeRight[0], colorRangeRight[1]]);
  }, [colorRangeRight]);

  const configPanel = useMemo(() => (
    <ConfigPanel
      selectedDataset={selectedDataset}
      setSelectedDataset={setSelectedDataset}
      selectedShape={selectedShape}
      setSelectedShape={setSelectedShape}
      selectedLeft={selectedLeft}
      setSelectedLeft={handleLeftChange}
      displayLeftError={displayLeftError}
      setDisplayLeftError={handleDisplayLeftError}
      selectedRight={selectedRight}
      setSelectedRight={handleRightChange}
      displayRightError={displayRightError}
      setDisplayRightError={handleDisplayRightError}
      selectedQuantity={selectedQuantity}
      setSelectedQuantity={setSelectedQuantity}
      pointSize={pointSize}
      setPointSize={setPointSize}
      isLoading={isLoading}
      colorRangeLeft={colorRangeLeft}
      setColorRangeLeft={setColorRangeLeft}
      colorRangeRight={colorRangeRight}
      setColorRangeRight={setColorRangeRight}
      globalMin={globalMin}
      globalMax={globalMax}
      leftRadius={leftRadius}
      setLeftRadius={setLeftRadius}
      rightRadius={rightRadius}
      setRightRadius={setRightRadius}
      onCopyLeftToRight={handleCopyLeftToRight}
      onCopyRightToLeft={handleCopyRightToLeft}
      squeezeColorRange={squeezeColorRange}
    />
  ), [selectedDataset, selectedShape, selectedLeft, displayLeftError, selectedRight, displayRightError, selectedQuantity, pointSize, colorRangeLeft, colorRangeRight, globalMin, globalMax, leftRadius, rightRadius, isLoading, handleLeftChange, handleRightChange, handleDisplayLeftError, handleDisplayRightError, handleCopyLeftToRight, handleCopyRightToLeft]);

  const getName = useCallback((method: string, dataset: string): string => 
    method + (method === "Ground Truth" && (dataset === "CAD" || dataset === "CAD_helios") ? " (no ground-truth)" : "")
  , []);

  const renderPointCloud = useMemo(() => {
    if (isLoading) {
      return (
        <div className="col-span-2 flex items-center justify-center h-[calc(100vh-100px)]">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        <PointCloudCanvas 
          name={getName(selectedLeft, selectedDataset)}
          pointCloudData={pointCloudDataLeft} 
          pointSize={pointSize}
          colorRange={colorRangeLeft}
          isLeft={true} 
          onControlsChange={handleControlsChange}
          index_method={getIndexMethod(selectedLeft)}
          displayError={displayLeftError}
          cameraStateRef={cameraStateRef}
        />
        <PointCloudCanvas 
          name={getName(selectedRight, selectedDataset)}
          pointCloudData={pointCloudDataRight} 
          pointSize={pointSize} 
          colorRange={colorRangeRight}
          isLeft={false} 
          onControlsChange={handleControlsChange}
          index_method={getIndexMethod(selectedRight)}
          displayError={displayRightError}
          cameraStateRef={cameraStateRef}
        />
      </div>
    );
  }, [pointCloudDataLeft, pointCloudDataRight, pointSize, colorRangeLeft, colorRangeRight, isLoading, selectedLeft, selectedRight, displayLeftError, displayRightError, selectedDataset, handleControlsChange, getName]);

  const renderPointCloudMobile = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        <PointCloudCanvas 
          isMobile={true}
          name={getName(selectedLeft, selectedDataset)}
          pointCloudData={pointCloudDataLeft} 
          pointSize={pointSize}
          colorRange={colorRangeLeft}
          isLeft={true} 
          onControlsChange={handleControlsChange}
          index_method={getIndexMethod(selectedLeft)}
          displayError={displayLeftError}
          cameraStateRef={cameraStateRef}
        />
        <PointCloudCanvas
          isMobile={true} 
          name={getName(selectedRight, selectedDataset)}
          pointCloudData={pointCloudDataRight} 
          pointSize={pointSize} 
          colorRange={colorRangeRight}
          isLeft={false} 
          onControlsChange={handleControlsChange}
          index_method={getIndexMethod(selectedRight)}
          displayError={displayRightError}
          cameraStateRef={cameraStateRef}
        />
      </div>
    );
  }, [pointCloudDataLeft, pointCloudDataRight, pointSize, colorRangeLeft, colorRangeRight, isLoading, selectedLeft, selectedRight, displayLeftError, displayRightError, selectedDataset, handleControlsChange, getName]);

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold">Point Cloud Visualizer</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              {configPanel}
            </SheetContent>
          </Sheet>
        </div>
        {renderPointCloudMobile}
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
        {configPanel}
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <div className="w-full p-4 items-center">
          {renderPointCloud}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export const Visualisator = forwardRef<HTMLDivElement, VisualisatorProps>((props, ref) => (
  <div ref={ref}>
    <VisualisatorContent {...props} />
  </div>
));

Visualisator.displayName = "Visualisator";
