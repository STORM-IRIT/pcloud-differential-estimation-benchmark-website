"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { PlusCircle, Trash2, Menu } from "lucide-react";
import { Separator } from "../components/ui/separator";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable"
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {ScrollArea} from "../components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { Info } from "lucide-react";


import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

import expe_DGtal from '../datatools/dataframes/DGTal';
import expe_PCPNet from '../datatools/dataframes/PCPNet';
import expe_CAD from '../datatools/dataframes/CAD';

import { PlotDataType, PlotDataAccessors } from '../datatools/types';

const allDataAccessors: { [key: string]: PlotDataAccessors } = {
    DGtal: expe_DGtal,
    PCPNet: expe_PCPNet,
    ABC: expe_CAD,
  };

interface AxisData {
  id: number;
  label: string;
  constraint: string | null;
}

type DataViewerProps = {
    selectedDataAccessor: string;
    setSelectedDataAccessor: (value: string) => void;
    xAxes: AxisData[];
    yAxes: AxisData[];
    splitBy: string | null;
    setSplitBy: (value: string | null) => void;
    updateAxis: (type: 'x' | 'y', id: number, value: string) => void;
    updateConstraint: (id: number, value: string | null) => void;
    addAxis: (type: 'x' | 'y') => void;
    removeAxis: (type: 'x' | 'y', id: number) => void;
  };
  

interface ConfigPanelProps {
    dataFiles: string[];
    selectedDataFile: string;
    setSelectedDataFile: (value: string) => void;
    possibleSpliters: string[];
    possibleConstraints: string[];
    xLabels: string[];
    yLabels: string[];
    xAxes: AxisData[];
    yAxes: AxisData[];
    updateAxis: (type: 'x' | 'y', id: number, value: string) => void;
    updateConstraint: (id: number, value: string | null) => void;
    addAxis: (type: 'x' | 'y') => void;
    removeAxis: (type: 'x' | 'y', id: number) => void;
    splitBy: string | null;
    setSplitBy: (value: string | null) => void;
  }

  const AxisSelector: React.FC<{
    type: 'x' | 'y';
    axes: AxisData[];
    headers: string[];
    possibleConstraints: string[];
    updateAxis: (type: 'x' | 'y', id: number, value: string) => void;
    updateConstraint: (id: number, value: string | null) => void;
    addAxis: (type: 'x' | 'y') => void;
    removeAxis: (type: 'x' | 'y', id: number) => void;
  }> = React.memo(({ type, axes, headers, possibleConstraints, updateAxis, updateConstraint, addAxis, removeAxis }) => {
    
    const bigName = type === 'x' ? "Rows" : "Cols";
    const littleName = type === 'x' ? "row" : "col";
    
    const content = (
      <>
        {axes.map((axis) => (
          
          <div key={axis.id} className="flex items-center space-x-2 mb-4">
            <Select
              value={axis.label}
              onValueChange={(value) => updateAxis(type, axis.id, value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={`Choose ${littleName}`} />
              </SelectTrigger>
              <SelectContent>
                {headers.map((header, index) => (
                  <SelectItem key={index} value={header}>{header}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {type === 'x' ? (
              <Select
                value={axis.constraint || 'none'}
                onValueChange={(value) => updateConstraint(axis.id, value === 'none' ? null : value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Data Type</SelectItem>
                  {possibleConstraints.map((constraint, index) => (
                    <SelectItem key={index} value={constraint}>{constraint}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="w-[200px]" />
            )}
            <Button variant="ghost" size="icon" onClick={() => removeAxis(type, axis.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </>
    );
  
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{bigName}</h3>
        {axes.length > 5 ? (
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            {content}
          </ScrollArea>
        ) : (
          content
        )}
        <Button variant="outline" size="sm" onClick={() => addAxis(type)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add {littleName}
        </Button>
      </div>
    );
  });
  
  const ConfigPanel: React.FC<ConfigPanelProps> = React.memo(({
    dataFiles,
    selectedDataFile,
    setSelectedDataFile,
    possibleSpliters,
    possibleConstraints,
    xLabels,
    yLabels,
    xAxes,
    yAxes,
    updateAxis,
    updateConstraint,
    addAxis,
    removeAxis,
    splitBy,
    setSplitBy
  }) => {
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
                <p className="text-sm space-y-2">
                  Configure the <strong>Dataset</strong> and axes for your visualization:
                  <br />
                  <br />
                  <strong>Rows:</strong> Select the <strong>x-axis</strong> and optionally apply a restriction to the experiments for each row.
                  <br />
                  <br />
                  <strong>Columns:</strong> Select the <strong>y-axis</strong> for the columns.
                  <br />
                  <br />
                  Adjust these settings to customize the data displayed in the plot.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h2>
        <Separator />
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Dataset</label>
            <Select value={selectedDataFile} onValueChange={setSelectedDataFile}>
              <SelectTrigger>
                <SelectValue placeholder="Select a data file" />
              </SelectTrigger>
              <SelectContent>
                {dataFiles.map((file, index) => (
                  <SelectItem key={index} value={file}>{file}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AxisSelector
            type="x"
            axes={xAxes}
            headers={xLabels}
            possibleConstraints={possibleConstraints}
            updateAxis={updateAxis}
            updateConstraint={updateConstraint}
            addAxis={addAxis}
            removeAxis={removeAxis}
          />
          <AxisSelector
            type="y"
            axes={yAxes}
            headers={yLabels}
            possibleConstraints={[]}
            updateAxis={updateAxis}
            updateConstraint={updateConstraint}
            addAxis={addAxis}
            removeAxis={removeAxis}
          />
        </div>
      </div>
    );
  });

  interface LogTicksResult {
  tickvals: number[];
  axisRange: [number, number];
}

function computeLogTicks(ymin: number, ymax: number, maxTicks: number = 8): LogTicksResult {
  if (ymin <= 0) ymin = 1e-6;
  if (ymax <= 0) ymax = ymin * 10;

  const pmin = Math.floor(Math.log10(ymin));
  const pmax = Math.ceil(Math.log10(ymax));

  const majorTicks: number[] = [];
  for (let p = pmin; p <= pmax; p++) {
    majorTicks.push(Math.pow(10, p));
  }

  const logYMin = Math.log10(ymin);
  const logYMax = Math.log10(ymax);
  const logMajorTicks = majorTicks.map(t => Math.log10(t));

  const tickBelowMin = Math.max(...majorTicks.filter(t => t <= ymin), ymin);
  const tickAboveMax = Math.min(...majorTicks.filter(t => t >= ymax), ymax);

  const distMinBelow = logYMin - Math.log10(tickBelowMin);
  const distMaxAbove = Math.log10(tickAboveMax) - logYMax;

  let axisMin = ymin;
  let axisMax = ymax;

  if (distMinBelow < distMaxAbove) {
    axisMin = tickBelowMin;
    axisMax = ymax;
  } else {
    axisMin = ymin;
    axisMax = tickAboveMax;
  }

  return {
    tickvals: majorTicks,
    axisRange: [axisMin, axisMax]
  };
}

function autoLogTicksSmart(ymin: number, ymax: number, maxTicks: number = 8): number[] {
  if (ymin <= 0) ymin = 1e-6;
  if (ymax <= 0) return [ymin];

  const ratio = ymax / ymin;

  if (ratio > 1000) {
    const startPow = Math.floor(Math.log10(ymin));
    const endPow = Math.ceil(Math.log10(ymax));
    const ticks: number[] = [];
    for (let p = startPow; p <= endPow; p++) {
      ticks.push(Math.pow(10, p));
    }
    return ticks;
  }

  const span = ymax - ymin;
  const rawStep = span / maxTicks;

  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;

  let niceStep: number;
  if (residual > 5) niceStep = 10 * magnitude;
  else if (residual > 2) niceStep = 5 * magnitude;
  else if (residual > 1) niceStep = 2 * magnitude;
  else niceStep = magnitude;

  const start = Math.floor(ymin / niceStep) * niceStep;
  const end = Math.ceil(ymax / niceStep) * niceStep;

  const ticks: number[] = [];
  for (let v = start; v <= end; v += niceStep) {
    if (v > 0) ticks.push(Number(v.toPrecision(12)));
  }

  return ticks;
}


export function DataViewer({
    selectedDataAccessor = 'DGtal',
    setSelectedDataAccessor = () => {},
    xAxes = [{ id: 1, label: '', constraint: null }],
    yAxes = [{ id: 1, label: '', constraint: null }],
    splitBy = null,
    setSplitBy = () => {},
    updateAxis = () => {},
    updateConstraint = () => {},
    addAxis = () => {},
    removeAxis = () => {},
  }: DataViewerProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [possibleSpliters, setPossibleDividers] = useState<string[]>([]);
    const [possibleConstraints, setPossibleConstraints] = useState<string[]>([]);
    const [plotData, setPlotData] = useState<any>(null);
  
    const currentAccessor = useMemo(() => allDataAccessors[selectedDataAccessor], [selectedDataAccessor]);
  
    useEffect(() => {
      const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);
      return () => window.removeEventListener('resize', checkIsMobile);
    }, []);
  
    useEffect(() => {
        const dividers = currentAccessor.getDividers();
        const constraints = currentAccessor.getConstraints();
        
        setPossibleDividers(dividers);
        setPossibleConstraints(constraints);

      }, [currentAccessor]);
  
      const generateImprovedAxisLayout = useMemo(() => (rows: number, cols: number) => {
        const layout: any = {};
        
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const index = i * cols + j + 1;
            
            layout[`xaxis${index}`] = {
              anchor: `y${index}`,
              title: xAxes[i].label,
            };
            layout[`yaxis${index}`] = {
              anchor: `x${index}`,
              title: yAxes[j].label,
              type: 'log',
              exponentformat: 'E',
            };
          }
        }
    
        return {
          ...layout,
          autosize: true,
          margin: { l: 50, r: 50, t: 50, b: 50 },
          showlegend: true,
          legend: { orientation: 'h', y: -0.2 },
        };
      }, [xAxes, yAxes]);

      const updatePlotData = useCallback(() => {
        const allPlots = {
          data: [] as any[],
          layout: {
            grid: { rows: xAxes.length, columns: yAxes.length, pattern: 'independent' },
          } as Record<string, any>
        };

        let methodList: string[] = [];
        const colorMap = currentAccessor.getColorMap();

        for (let i = 0; i < xAxes.length; i++) {
          for (let j = 0; j < yAxes.length; j++) {
            if (xAxes[i].label && yAxes[j].label) {
              const data = currentAccessor.getSpecificData(xAxes[i].label, yAxes[j].label, splitBy, xAxes[i].constraint);
              if (data) {
                let localY: number[] = [];
                const newPlotData = Object.entries(data).map(([method, values]) => {
                  localY = localY.concat(values[1]); 
                  const showLegend = !methodList.includes(method);
                  if (showLegend) methodList.push(method);
                  return {
                    x: values[0],
                    y: values[1],
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: method,
                    marker: { color: colorMap[method] || '#000000' },
                    showlegend: showLegend,
                    legendgroup: method,
                    xaxis: `x${i * yAxes.length + j + 1}`,
                    yaxis: `y${i * yAxes.length + j + 1}`,
                  };
                });
                allPlots.data = allPlots.data.concat(newPlotData);

                if (localY.length > 0) {
                  const ymin = Math.min(...localY);
                  const ymax = Math.max(...localY);
                  const ticks = autoLogTicksSmart(ymin, ymax);

                  allPlots.layout[`yaxis${i * yAxes.length + j + 1}`] = {
                    type: 'log',
                    title: yAxes[j].label,
                    tickvals: ticks,
                    exponentformat: 'E',
                    ticktext: ticks.map(v => v.toExponential()),
                    anchor: `x${i * yAxes.length + j + 1}`,
                  };
                }
                allPlots.layout[`xaxis${i * yAxes.length + j + 1}`] = {
                  anchor: `y${i * yAxes.length + j + 1}`,
                  title: xAxes[i].label,
                };
              }
            }
          }
        }

      allPlots.layout = {
        ...allPlots.layout,
        autosize: true,
        margin: { l: 50, r: 50, t: 50, b: 50 },
        showlegend: true,
        legend: { orientation: 'h', y: -0.2 },
      };
      setPlotData(allPlots);
    }, [currentAccessor, xAxes, yAxes, splitBy]);

    useEffect(() => {
      updatePlotData();
    }, [updatePlotData]);
  
    const renderPlot = useMemo(() => {
        if (!plotData) {
          return null;
        }
    
        return (
          <div style={{ width: "100%", height: "calc(100vh - 100px)" }}> {}
            <Plot
              data={plotData.data}
              layout={{
                ...plotData.layout,
                autosize: true,
              }}
              style={{ width: "100%", height: "100%" }}
              config={{ responsive: true }}
              useResizeHandler={true}
            />
          </div>
        );
      }, [plotData]);
  
      const configPanel = useMemo(() => (
        <ConfigPanel 
          dataFiles={Object.keys(allDataAccessors)}
          selectedDataFile={selectedDataAccessor}
          setSelectedDataFile={setSelectedDataAccessor}
          possibleSpliters={possibleSpliters}
          possibleConstraints={possibleConstraints}
          xLabels={currentAccessor.getXLabels()}
          yLabels={currentAccessor.getYLabels()}
          xAxes={xAxes}
          yAxes={yAxes}
          updateAxis={updateAxis}
          updateConstraint={updateConstraint}
          addAxis={addAxis}
          removeAxis={removeAxis}
          splitBy={splitBy}
          setSplitBy={setSplitBy}
        />
    ), [selectedDataAccessor, currentAccessor, xAxes, yAxes, updateAxis, updateConstraint, addAxis, removeAxis, splitBy, possibleSpliters, possibleConstraints, setSelectedDataAccessor, setSplitBy]);
  
    if (isMobile) {
      return (
        <div className="flex flex-col h-screen">
          <div className="flex justify-between items-center p-4 border-b">
            <h1 className="text-2xl font-bold">Data Viewer</h1>
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
          <div className="flex-grow p-4 overflow-auto">
            {renderPlot}
          </div>
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
            {renderPlot}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  DataViewer.displayName = 'DataViewer';
  AxisSelector.displayName = 'AxisSelector';
  ConfigPanel.displayName = 'ConfigPanel';

  export default React.memo(DataViewer);