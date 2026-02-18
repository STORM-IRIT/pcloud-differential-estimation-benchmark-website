"use client";
import React, { useState } from "react"
import { ModeToggle } from "./components/ui/toggle-mode";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

import { DataViewer } from "./tabs/dataViewer"
import { Visualisator } from "./tabs/visualisator";
import { Informations } from "./tabs/Informations";
import DownloadButton from "./datatools/downloadButton";

type AxisData = {
  id: number;
  label: string;
  constraint: string | null;
};
export default function Home() {
  const [activeTab, setActiveTab] = useState("Data");
  const [showDatasetPopup, setShowDatasetPopup] = useState(false);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Shared state
  const [selectedDataAccessor, setSelectedDataAccessor] = useState<string>('DGtal');
  const [splitBy, setSplitBy] = useState<string | null>(null);

  const [xAxes, setXAxes] = useState<AxisData[]>([
    { id: 1, label: 'Radius', constraint: "No noise" },
    { id: 2, label: 'Radius', constraint: "Noise position" }
  ]);
  const [yAxes, setYAxes] = useState<AxisData[]>([
    { id: 1, label: 'RMSE Mean curvature', constraint: null },
    { id: 2, label: 'RMSAE Normal', constraint: null }
  ]);

  const updateAxis = (type: 'x' | 'y', id: number, value: string) => {
    const setter = type === 'x' ? setXAxes : setYAxes;
    setter(prevAxes => prevAxes.map(axis => 
      axis.id === id ? { ...axis, label: value } : axis
    ));
  };

  const updateConstraint = (id: number, value: string | null) => {
    setXAxes(prevAxes => prevAxes.map(axis => 
      axis.id === id ? { ...axis, constraint: value } : axis
    ) as AxisData[]);
  };

  const addAxis = (type: 'x' | 'y') => {
    const setter = type === 'x' ? setXAxes : setYAxes;
    const axes = type === 'x' ? xAxes : yAxes;
    const newId = Math.max(...axes.map(axis => axis.id), 0) + 1;
    setter(prevAxes => [...prevAxes, { id: newId, label: '', constraint: null }]);
  };

  const removeAxis = (type: 'x' | 'y', id: number) => {
    const setter = type === 'x' ? setXAxes : setYAxes;
    const axes = type === 'x' ? xAxes : yAxes;
    if (axes.length > 1) {
      setter(prevAxes => prevAxes.filter(axis => axis.id !== id));
    }
  };

  return (
    <main className="min-h-screen p- sm:p-6 md:p-8 lg:p-12 xl:p-7 bg-gray-50 dark:bg-gray-900" style={{minWidth:"450px"}}> 
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-gray-900 dark:text-white">
            Point Cloud Diff Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Analysis of differential properties estimators.
          </p>
        </div>
        <div className="flex gap-2">
          <DownloadButton 
            driveLink={""} // {"https://cloud.irit.fr/s/lVfX8u4ESZZzgO5"}
            buttonText="Dataset" 
            onUnavailable={() => setShowDatasetPopup(true)} 
          />
          <ModeToggle />
        </div>
      </div>

      <div>
        <Tabs defaultValue="Info" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="flex flex-wrap justify-start mb-4 border-b border-gray-300 dark:border-gray-700">
            <TabsTrigger value="Info" className="mb-4 mr-4">Infos</TabsTrigger>
            <TabsTrigger value="Data" className="mb-4 mr-4">Data</TabsTrigger>
            <TabsTrigger value="Visualisator" className="mb-4">3D Viewer</TabsTrigger>
          </TabsList>

          <TabsContent value="Info">
            <Informations />
          </TabsContent>

          <TabsContent value="Data">
            <div className="mb-4 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
              <p>
                The Data Viewer provides an interactive interface for exploring experimental results across multiple datasets and estimators. 
                Users can select <span className="font-bold">rows (x-axes)</span> and <span className="font-bold">columns (y-axes)</span> from the available variables, 
                with optional constraints applied to specific experiments.
                <br/>
                For clarity and simplicity, <span className="font-bold">all plots are displayed on a logarithmic scale</span>, 
                which may cause the figures to <span className="font-bold">appear slightly different from those reported in the paper</span>. 
                Only the data corresponding to the selected axes and estimators are shown.
                <br/>
                Due to the static nature of the web interface, <span className="font-bold">parameter customization is limited</span>, 
                but users can still configure axes, apply constraints, and choose from the available datasets to investigate differential property estimators.
              </p>

            </div>
            <DataViewer 
              selectedDataAccessor={selectedDataAccessor}
              setSelectedDataAccessor={setSelectedDataAccessor}
              xAxes={xAxes}
              yAxes={yAxes}
              splitBy={splitBy}
              setSplitBy={setSplitBy}
              updateAxis={updateAxis}
              updateConstraint={updateConstraint}
              addAxis={addAxis}
              removeAxis={removeAxis}
            />
          </TabsContent>

          <TabsContent value="Visualisator">
            <div className="mb-4 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
              <p>
                The 3D Viewer allows interactive exploration of point cloud data through our web interface.
                <br/>
                Due to the nature of the ABC and ABC_helios datasets, <span className="font-bold">no ground truth is available</span> for these models; consequently, ground-truths and error metrics cannot be displayed for these figures.
                <br/>
                In order to meet the submission upload requirements, <span className="font-bold">only a limited set of parameters is available</span> for visualization, as well as only <span className="font-bold">3 shapes per dataset</span>.
                <br/>
                Currently, users can display <span className="font-bold">mean and Gaussian curvatures</span>. Only estimators capable of computing these properties are included in the dropdown menus.
              </p>
            </div>
            <Visualisator/>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dataset Popup */}
      {showDatasetPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-sm text-center">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white"></h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">Coming soon</p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              onClick={() => setShowDatasetPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* <div>
        <footer className="py-4 text-center mt-auto">
          <p>Developed by Name</p>
          <p>Version 1.0.0</p>
        </footer>
      </div> */}
    </main>
  );
}
