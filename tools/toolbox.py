import pandas as pd
import seaborn as sns
import sys
import os


import methods as m
headers=['N', "Radius", "Noise position", "Noise normal", "flip-normal", 'Nb neighbors (mean)', 'Nb neighbors max', 'Nb neighbors (var)', 'Mean curvature (mean)', 'Mean max', 'Mean curvature (var)','Gaussian curvature (mean)', 'Gaussian curvature (max)', 'Gaussian var', "K1 mean", "K1 max", 'K1 var',"K2 mean","K2 max","K2 var","D1 mean", "D1 max", "D1 var", "D2 mean", "D2 max", "D2 var", "pos mean", "pos max", "pos var", "iShape mean", "iShape max", "iShape var", "normal mean", "normal max", "normal var", "Timings (mean)", "Timings max", "Timings var", "non_stable_ratio", "Method"]


shapes = ["torus", "goursat", "goursat-hole", "cylinder", "leopold", "distel", "heart", "sphere9", "crixxi", "diabolo", "ellipsoid"]
simple_shapes = ["hyperboloid", "paraboloid", "selle", "tube"]
ply_shapes = ["0001", "0002", "0003", "0006", "0034", "1023"]
helios_shapes = [ "00000002" ,"00000003", "00000004", "00000006" ,"00000008" ,"00000020" ,"00000022", "00000027", "00000030", "00000049", "00000050" ]
shapes = shapes + simple_shapes + ply_shapes + helios_shapes


unwanted_methods=m.unwanted_methods
all_methods = m.all_methods
mean_curvature_estimation = m.mean_curvature_estimation
principal_curvature_estimation = m.principal_curvature_estimation
normal_estimation = m.normal_estimation
curvature_direction = m.curvature_direction
mls_methods= m.mls_methods
references= m.references

diff_properties = ["Mean curvature", "Gaussian curvature", "K1", "K2", "D1", "D2", "iShape"]

dataset_properties = {
    "Helios" : ["normal", "pos"], 
    "CAD" : ["normal", "pos"],
    "Implicit" : ["normal", "pos", "K1", "K2", "D1", "D2", "Mean curvature", "Gaussian curvature", "iShape"],
    "PCPNet" : ["normal", "pos", "K1", "K2", "Mean curvature", "Gaussian curvature", "iShape"],
}


def clean_data(dataframe):
    # for each row, if the column dataset is provided, check if columns containing diff_properties are in the dataset_properties. 
    # If not, put the value at the column to Nan.

    for index, row in dataframe.iterrows():

        if "dataset" in dataframe.columns:
            current_dataset = row["dataset"]
            for column in dataframe.columns:
                for prop in diff_properties:
                    if prop in column:
                        if prop not in dataset_properties[current_dataset]:
                            dataframe.at[index, column] = None
        else :
            continue

    return dataframe

def mean_cov_methods ( dataframe ):
    all_methods = dataframe["Method"].unique().tolist()
    mean_methods = ["Oriented2-Monge", "OrientedWaveJets", "OrientedPC-MLS"]
    cov_methods = ["2-Monge", "WaveJets", "PC-MLS"]
    return all_methods, mean_methods, cov_methods

def methods (dataframe, orientation=True): 
    all_met = [method for method in all_methods if method not in unwanted_methods]
    # unoriented = ["UnorientedSphere_PONCA", "Sphere_PONCA", "PCA_PONCA", "JetFitting", "2-Monge_PONCA", "WaveJets_PONCA", "B2D_PONCA", "Cov2D_PONCA", "NormCov2D_PONCA", "NormCov3D_PONCA", "Mean_PONCA"]
    unoriented = ["UnorientedSphere", "Sphere", "PCA", "JetFitting", "2-Monge", "WaveJets", "B2D", "Cov2D", "NormCov2D", "NormCov3D", "Mean"]
    oriented = []
    for method in all_met:
        if method not in unoriented:
            oriented.append(method)
    if orientation:
        return all_met, oriented
    else:
        return all_met, unoriented

def find_shape(file_path):
    """
    Find the shape name in a file path.
    """

    # Grab the name of the file only
    filename = os.path.basename(file_path)
    # The name should be allErrorStats-shape.dat, but shape can have multiple words separated by "-", "_" or "."
    # We split the name of the file by "-" "_" and "."
    grab_name = filename.split(".dat")[0].split("-")[1:]
    shape_name = ""
    for i in range(0, len(grab_name)):
        shape_name += grab_name[i]

    # print (f'The name of the shape is : {shape_name}') 

    return shape_name

    # for shape in shapes:
    #     if shape in file_path:
    #         if (shape == "goursat") :
    #             if "goursat-hole" in file_path:
    #                 return "goursat-hole"
    #         return shape
    # return None

def add_header_from_filename(df, file_path):
    """
    Add headers to a dataframe from its filename.
    """

    # Grab the name of the file
    filename = os.path.basename(file_path)
    # Split the name of the file
    filename = filename.split(".dat")[0].split("=")
    # If there is only one element, it means that there is no header
    if len(filename) == 1:
        return df
    
    # print (filename)

    # one "=" is equal to new header, and it is possible to have multiple "="
    for i in range(0, len(filename)-1):
        header_name = filename[i].split(".")[-1].split("_")[-1].split("-")[-1]
        header_value = filename[i+1].split("_")[0].split("-")[0]
        df[header_name] = header_value
        # print (header_name, header_value)

    return df

def open_data_file(file_path, header=headers, added_param=[]):
    shape = find_shape(file_path)
    if shape is None:
        return None
    df = pd.read_csv(file_path, names=header, delim_whitespace=True,header=None)
    df["Shape"] = shape
    if added_param != []:
        for param in added_param:
            df[param[0]] = param[1]
    return df

def open_data_dir(dir_path, added_param=[],header=headers, recursive=False):
    
    data = []

    for file in os.listdir(dir_path):
            file_path = os.path.join(dir_path, file)
            
            if file.endswith(".dat"):
                
                data_current = open_data_file(file_path, header, added_param)
                
                if data_current is None:
                    continue

                data.append(add_header_from_filename(data_current, file_path))

            if os.path.isdir(file_path) and recursive:
                data += open_data_dir(file_path, added_param, recursive)

    return data

def open_data_all(dir_path, added_param=[],header=headers, recursive=False):
    """
    Open a dat file and return a dataframe.
    added_param is a list of tuple (name, value) to add to the dataframe.
    recursive is a boolean to open all the files in the directory and subdirectories.
    
    [TODO] Modify this function to be generic with shapes.
    """

    data = open_data_dir(dir_path, added_param,header, recursive)

    if len(data) != 0:
        return pd.concat(data)
    
    return None

def add_header(df, added_param=[]):
    """
    Add headers to a dataframe.
    """
    for param in added_param:
        df[param[0]] = param[1]
    return df