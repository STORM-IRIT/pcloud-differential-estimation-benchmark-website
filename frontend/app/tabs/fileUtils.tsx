import { useState, useEffect } from 'react';

const isProd = process.env.NODE_ENV === 'production';
const isStatic = process.env.STATIC_BUILD === 'true';
const repoName = 'PCDiff';

// Fonction pour obtenir le chemin de base
const getBasePath = () => {
  if (isProd && !isStatic) {
    return `/${repoName}/images`;
  }
  return '/images';
};

// Fonction pour obtenir le chemin complet d'une image
export const getImagePath = (experiment: string, dataset: string, shape: string, method: string, quantity: string) => {
    return `${getBasePath()}/${experiment}/${dataset}/${shape}/${method}-${quantity}.png`;
};

export const useAvailableData = () => {
    const [datasets, setDatasets] = useState<string[]>([]);
    const [shapes, setShapes] = useState<{ [dataset: string]: string[] }>({});
  
    const methods = ['APSS', 'ASO', 'AvgHexagram', 'Ellipsoid', 'FO2D', 'JetFitting', 'Oriented2-Monge', 'OrientedWaveJets', 'ShapeOperator', 'Varifolds'];
    // const quantities = ['kMean', 'kMax', 'kMin', 'kGauss'];
    const quantities = ['Mean Curvature', 'Max Curvature', 'Min Curvature', 'Gaussian Curvature'];
  
    useEffect(() => {
      setDatasets(['DGTal', 'DGTal_helios', 'CAD', 'CAD_helios', 'PCPNet']);
      setShapes({
        'DGTal': ['cylinder',  'ellipsoid',  'goursat',  'goursat-hole',  'hyperboloid',  'paraboloid',  'selle',  'torus',  'tube'],
        'DGTal_helios': ['cylinder',  'ellipsoid',  'goursat',  'goursat-hole',  'hyperboloid',  'paraboloid',  'selle',  'torus',  'tube'],
        'CAD': ['0001', '0002', '0003', '0006', '0034'],
        'CAD_helios': ['00000002', '00000003', '00000004', '00000006', '00000008', '00000020', '00000022', '00000027', '00000030', '00000049', '00000050'], 
        'PCPNet': ['Boxy_smooth', 'boxunion2', 'cylinder', 'icosahedron', 'pipe_curve', 'sphere_analytic', 'star_smooth',
          'Cup34', 'column', 'cylinder_analytic', 'netsuke', 'sheet_analytic', 'star_halfsmooth',
          'Liberty', 'column_head', 'galera', 'pipe', 'sphere', 'star_sharp'],
      });
    }, []);
  
    return { datasets, shapes, methods, quantities };
};

export const useImageSelection = () => {
    const { datasets, shapes, methods, quantities } = useAvailableData();
    const [selectedDataset, setSelectedDataset] = useState<string>('DGtal');
    const [selectedShape, setSelectedShape] = useState<string>('cylinder');
    const [selectedLeftMethod, setSelectedLeftMethod] = useState<string>('APSS');
    const [selectedRightMethod, setSelectedRightMethod] = useState<string>('ASO');
    const [selectedQuantity, setSelectedQuantity] = useState<string>('Mean Curvature');
  
    
    const resetSelection = (level: 'dataset' | 'shape' | 'method' | 'quantity') => {

      switch (level) {
        case 'dataset':
          setSelectedShape(shapes[selectedDataset][0]);
          case 'shape':
            setSelectedLeftMethod(methods[0]);
            setSelectedRightMethod(methods[1]);
            case 'method':
              setSelectedQuantity(quantities[0]);
              break;
              case 'quantity':
                break;
              }
            };
            
    const availableShapes = ( selectedDataset !== '' ) ? shapes[selectedDataset] || [] : [];
    const availableMethods = methods;
    const availableQuantities = quantities;
  
    return {
      selectedDataset,
      setSelectedDataset: (dataset: string) => {
        setSelectedDataset(dataset);
        setSelectedShape(shapes[dataset][0]);
        setSelectedLeftMethod(methods[0]);
        setSelectedRightMethod(methods[1]);
        setSelectedQuantity(quantities[0]);
      },
      selectedShape,
      setSelectedShape: (shape: string) => {
        setSelectedShape(shape);
        // resetSelection('shape');
      },
      selectedLeftMethod,
      setSelectedLeftMethod: (method: string) => {
        setSelectedLeftMethod(method);
        // resetSelection('method');
      },
      selectedRightMethod,
      setSelectedRightMethod: (method: string) => {
        setSelectedRightMethod(method);
        // resetSelection('method');
      },
      selectedQuantity,
      setSelectedQuantity: (quantity: string) => {
        setSelectedQuantity(quantity);
        resetSelection('quantity');
      },
      datasets,
      availableShapes,
      availableMethods,
      availableQuantities
    };
  };
