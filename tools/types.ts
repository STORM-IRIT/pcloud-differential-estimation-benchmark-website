
export interface PlotDataType {
  [method: string]: [number[], number[]];
}

export interface PlotDataSet {
  xLabels: string[];
  yLabels: string[];
  dividers: string[];
  constraints: string[];
  data: {
    [key: string]: PlotDataType;
  };
  colorMap: {
    [method: string]: string;
  };
}

export interface PlotDataAccessors {
  getXLabels: () => string[];
  getYLabels: () => string[];
  getDividers: () => string[];
  getConstraints: () => string[];
  getData: () => { [key: string]: PlotDataType };
  getDataForKey: (key: string) => PlotDataType | undefined;
  getSpecificData: (xLabel: string, yLabel: string, divider: string | null, constraint: string | null) => PlotDataType | null;
  getColorMap : () => { [method: string]: string };
}
