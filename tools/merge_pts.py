import os 
import sys
import argparse
import glob

# (groundtruth, corresponding) 
dataset_gt_e = [
    # ("dataset_CAD", "CAD"),
    # ("dataset_helios","CAD_helios"),
    ("dataset_implicit","DGtal"),
    # ("dataset_implicit_helios","DGtal_helios"),
    # ("PCPNet_rescaled","PCPNet"),
]

quantities_n_idx = [
    ('kMean', 4), 
    ('kGauss', 3),
    ('kMin', 8),
    ('kMax', 9),
]

quantities_n_idx_err = [
    ('kMean', 5), 
    ('kGauss', 4),
    ('kMin', 6),
    ('kMax', 7),
]

methods = [
    ('Mean', 4),
    ('Cov2D', 5),
    ('NormCov2D', 6),
    ('NormCov3D', 7),
    ('ShapeOperator', 8),
    ('PCA', 9),
    ('2-Monge', 10),
    ('PC-MLS', 11),
    ('JetFitting', 12),
    ('WaveJets', 13),
    ('Sphere', 14),
    ('APSS', 15),
    ('UnorientedSphere', 16),
    ('ASO', 17),
    ('3DQuadric', 18),
    ('Varifolds', 19),
    ('AvgHexagram', 20),
]

# filename will be in the format allErrorStats-<shape>_<method>_<radius>_estim.pts
def grab_method(filename): 
    for method, idx in methods:
        if method in filename:
            if method == "Cov2D" and "NormCov2D" in filename:
                return "NormCov2D"
            if method == "Sphere" and "UnorientedSphere" in filename:
                return "UnorientedSphere"
            return method
    return None

def grab_shape(filename):
    first_part = filename.split("-")[0]
    second_part = filename.split("-")[1:]
    second_part = "-".join(second_part)
    second_part = second_part.split("_")[:-3]
    shape = ""
    for part in second_part:
        shape += part + "_"
    shape = shape[:-1]
    return shape

# idx 0, 1 and 2 are reserved for the 3D positions, idx 3 if for the ground truth value, and the rest for the estimated values
def grab_index(filename):
    for method, idx in methods :
        if method in filename:
            return idx
    return -1

# By default, the quantity kMean value is at index 4
def grab_values(filename, quantity_idx = 4) :
    positions = []
    values = []
    print (filename + " " + str(quantity_idx))
    with open(filename, 'r') as f:
        for line in f:
            if "#" in line:
                continue
            line = line.split("\n")[0]
            line = line.split("\r")[0]
            line = line.split(" ")
            pos = [float(line[0]), float(line[1]), float(line[2])]
            pos = [0.0 if abs(p) <= 2e-5 else p for p in pos]
            positions.append(pos)
            values.append(line[quantity_idx])
    return positions, values

# quantities_n_idx = [
#     ('kMean', 4), 
#     ('kGauss', 3),
#     ('kMin', 8),
#     ('kMax', 9),
# ]
def grab_ground_truth(filename, quantity_idx = 4) :
    positions = []
    values = []
    kMin_idx = quantities_n_idx[2][1]
    kMax_idx = quantities_n_idx[3][1]

    with open(filename, 'r') as f:
        for line in f:
            if "#" in line:
                continue
            line = line.split("\n")[0]
            line = line.split("\r")[0]
            line = line.split(" ")
            pos = [float(line[0]), float(line[1]), float(line[2])]
            pos = [0.0 if abs(p) <= 2e-5 else p for p in pos]
            positions.append([line[0], line[1], line[2]])
            # take the absolute value of the ground truth value
            kmin = abs(float(line[kMin_idx]))
            kmax = abs(float(line[kMax_idx]))
            if quantity_idx == 4:
                values.append((kmin + kmax) / 2.0)
            elif quantity_idx == 8 or quantity_idx == 9:
                if kmin > kmax:
                    kmin, kmax = kmax, kmin
                if quantity_idx == 8:
                    values.append(kmin)
                else:
                    values.append(kmax)                    
            elif quantity_idx == 3:
                values.append(abs(float(line[quantity_idx])))
            # values.append(line[quantity_idx])

    return positions, values

def shape_names (dir_gt) :
    shapes = []
    for file in os.listdir(dir_gt):
        if file.endswith(".pts"):
            shapes.append(file.split(".")[0])
    return shapes

def estimation_paths (dir_est) :
    shapes = {}

    append_mode = "_25000" if dir_est.endswith("implicit") else ""

    for file in glob.glob(dir_est + "*/*/*"):
        if append_mode == "_25000" and "implicit_helios" in file:
            continue
        basename = os.path.basename(file)
        if basename.endswith(".pts"):
            shape = grab_shape(basename) + append_mode
            method = grab_method(basename)
            if shape not in shapes:
                shapes[shape] = {}
            shapes[shape][method] = file
    
    for file in glob.glob(dir_est + "/*/*/*"):
        if append_mode == "_25000" and "implicit_helios" in file:
            continue
        basename = os.path.basename(file)
        if basename.endswith(".pts"):
            shape = grab_shape(basename) + append_mode
            method = grab_method(basename)
            if shape not in shapes:
                shapes[shape] = {}
            shapes[shape][method] = file
    return shapes

def groundtruth_paths (shapes_dict, dir_gt) :
    shapes = {}
    for file in os.listdir(dir_gt):
        if file.endswith(".pts"):
            basename = os.path.basename(file)
            shape = basename.split(".")[0]
            if shape in shapes_dict:
                shapes[shape] = os.path.join(dir_gt, file)
    return shapes

def merge_files(groundtruths, estimations, quantity_idx=4, output_dir=""):
    for shape in groundtruths:
        print("\n[ESTIMATION] Merging shape " + shape  + " with quantity " + str(quantity_idx))
        gt_positions, gt_values = grab_ground_truth(groundtruths[shape], quantity_idx)
        aligned_values = {}
        for method, _ in methods:
            if method in estimations[shape]:
                est_positions, est_values = grab_values(estimations[shape][method], quantity_idx)
                est_pos_set = set(tuple(float(p) for p in pos) for pos in est_positions)
                bool_list = [tuple(float(p) for p in pos) in est_pos_set for pos in gt_positions]
                pos_to_value = {tuple(float(p) for p in pos): val for pos, val in zip(est_positions, est_values)}
                
                aligned = []
                for pos, exists in zip(gt_positions, bool_list):
                    key = tuple(float(p) for p in pos)
                    if exists:
                        aligned.append(pos_to_value.get(key, "0"))
                    else:
                        aligned.append("0")
                aligned_values[method] = aligned
            else:
                print(f"Method {method} not found for shape {shape}")
                aligned_values[method] = ["100"] * len(gt_positions)
        merged_file_content = ""
        for i in range(len(gt_positions)):
            pos = gt_positions[i]
            line = f"{pos[0]} {pos[1]} {pos[2]} {gt_values[i]}"
            for method, _ in methods:
                line += " " + aligned_values[method][i]
            merged_file_content += line + "\n"
        output_file = os.path.join(output_dir, shape + ".pts")
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        with open(output_file, 'w') as f:
            f.write(merged_file_content)


def merge_files_error(groundtruths, errors, quantity_idx_err, quantity_idx, output_dir):
    for shape in groundtruths:
        print("\n[ERROR] Merging shape " + shape + " with quantity " + str(quantity_idx_err) + " and " + str(quantity_idx))
        gt_positions, gt_values = grab_ground_truth(groundtruths[shape], quantity_idx)
        err_maps = {}
        for method in errors[shape]:
            est_positions, est_values = grab_values(errors[shape][method], quantity_idx_err)
            pos_to_err = {tuple(float(p) for p in pos): val for pos, val in zip(est_positions, est_values)}
            err_maps[method] = pos_to_err
        aligned_errors = {}
        for method, _ in methods:
            if method in err_maps:
                method_map = err_maps[method]
                aligned = []
                for pos in gt_positions:
                    key = tuple(float(p) for p in pos)
                    aligned.append(method_map.get(key, "0"))
                aligned_errors[method] = aligned
            else:
                print("Method " + method + " not found for shape " + shape)
                aligned_errors[method] = ["100"] * len(gt_positions)
        merged_file_content = ""
        for i in range(len(gt_values)):
            pos = gt_positions[i]
            line = f"{pos[0]} {pos[1]} {pos[2]} {gt_values[i]}"
            for method, _ in methods:
                line += " " + aligned_errors[method][i]
            merged_file_content += line + "\n"
        output_file = os.path.join(output_dir, shape + ".pts")
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        with open(output_file, 'w') as f:
            f.write(merged_file_content)


if __name__ == '__main__' :
    parser = argparse.ArgumentParser(description='Merge the estimated values of a quantity from different methods into a single file.')
    parser.add_argument('--groundtruths', type=str, help='Input dataset groundtruths.', required=True)
    parser.add_argument('--estimations', type=str, help='Input estimations.', default="")
    parser.add_argument('--errors', type=str, help='Input errors.', default="")
    parser.add_argument('--output', type=str, help='Output directory.', required=True)
    parser.add_argument('--quantity_idx', type=int, default=4, help='Index of the quantity to merge.')
    args = parser.parse_args()

    if args.groundtruths.endswith("/") :
        args.groundtruths = args.groundtruths[:-1]
    
    if args.estimations != "" and args.estimations.endswith("/") :
        args.estimations = args.estimations[:-1]
    
    if args.output.endswith("/") :
        args.output = args.output[:-1]

    if args.estimations != "" :
        for groundtruth_name, estimation_name in dataset_gt_e :
            for quantity_name, quantity_idx in quantities_n_idx :
                groundtruth_path = os.path.join(args.groundtruths, groundtruth_name)
                estimation_path = os.path.join(args.estimations, estimation_name) 
                output_dir = os.path.join(args.output, estimation_name, quantity_name)
                print (f'gt {groundtruth_path}, estim {estimation_path}, out: {output_dir}')
                estimations = estimation_paths(estimation_path)
                groundtruths = groundtruth_paths(estimations, groundtruth_path)
                merge_files(groundtruths, estimations, quantity_idx, output_dir)

    if args.errors != "" :
        for groundtruth_name, estimation_name in dataset_gt_e :
            for (quantity_name_err, quantity_idx_err), (quantity_name, quantity_idx) in zip(quantities_n_idx_err, quantities_n_idx) :
                print (f"\n{quantity_name_err} , {quantity_idx_err}")
                print (f"{quantity_name} , {quantity_idx}")
                groundtruth_path = os.path.join(args.groundtruths, groundtruth_name)
                error_path = os.path.join(args.errors, estimation_name) 
                output_dir = os.path.join(args.output, estimation_name, quantity_name_err)
                print (f'gt {groundtruth_path}, estim {error_path}, out: {output_dir}')
                errors = estimation_paths(error_path)
                groundtruths = groundtruth_paths(errors, groundtruth_path)
                merge_files_error(groundtruths, errors, quantity_idx_err, quantity_idx, output_dir)