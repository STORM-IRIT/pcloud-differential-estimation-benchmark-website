import plotly.graph_objects as go
import plotly.offline as pyo
import plotly.subplots as sp
import numpy as np 
import random
import math

import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors

import methods as m
import sys
import os

random_color = ['rgba(243,101,81,1)', 'rgba(131,22,23,1)', 'rgba(96,128,64,1)', 'rgba(171,157,84,1)', 'rgba(171,117,84,1)', 'rgba(81,100,145,1)', 'rgba(81,129,242,1)', 'rgba(157,45,243,1)', 'rgba(107,0,243,1)', 'rgba(18,100,235,1)','rgba(18,230,7,1)']


properties = {
    "Mean curvature (mean)": m.mean_curvature_estimation,
    "Gaussian curvature (mean)": m.principal_curvature_estimation,
    "K1 mean": m.principal_curvature_estimation,
    "K2 mean": m.principal_curvature_estimation,
    "Timings (mean)": m.all_methods,
    "D1 mean": m.curvature_direction,
    "D2 mean": m.curvature_direction,
    "normal mean": m.normal_estimation,
    "iShape mean": m.principal_curvature_estimation,
    "pos mean": m.all_methods,
    "Nb neighbors (mean)" : m.all_methods,
    "non_stable_ratio" : m.all_methods,
}

def generate_random_color(alpha='1'):
    '''Generate a random color in RGBA format.'''
    r, g, b = random.sample(range(0, 256), 3)
    return f'rgba({r},{g},{b},{alpha})'

def visualize_shape(filename,properties=4): 
    
    # Reading the .pts file
    data = np.genfromtxt(filename, delimiter=' ')

    # Extract x, y, z coordinates
    x = data[:, 0]
    y = data[:, 1]
    z = data[:, 2]

    # Extraction of nx, ny, nz normals
    nx = data[:, 6]
    ny = data[:, 7]
    nz = data[:, 8]

    col= data[:,properties]
    trace = go.Scatter3d(
        x=x,
        y=y,
        z=z,
        mode='markers',
        marker=dict(
            size=2,
            color=col,
            colorscale='Balance',
            opacity=0.8
        )
    )

    layout = go.Layout(
        scene=dict(
            xaxis=dict(title='X'),
            yaxis=dict(title='Y'),
            zaxis=dict(title='Z')
        )
    )
    fig = go.Figure(data=[trace], layout=layout)
    fig.show()

def visualize_neighbor(build_dir, input_file, output_file, index=0, kNN=-1, radius=-1, use_kNNgraph = False): 
    
    request = ""
    if kNN != -1: 
        request = " -k " + str(kNN)
    elif radius != -1:
        request = " -r " + str(radius)
    
    idx_request = " --index " + str(index)

    if (use_kNNgraph):
        idx_request += " --knn-graph"
    
    exec_path = build_dir + "/estimators/compute_ponca_neighbors -i " + input_file + " -o " + output_file + " " + request + " " + idx_request
    
    # Execute the command
    os.system(exec_path)
    
    # Reading the .pts file
    data = np.genfromtxt(output_file, delimiter=' ')

    # Extract x, y, z coordinates
    x = data[:, 0]
    y = data[:, 1]
    z = data[:, 2]

    # Extraction of nx, ny, nz normals
    nx = data[:, 3]
    ny = data[:, 4]
    nz = data[:, 5]

    col= data[:,6]
    trace = go.Scatter3d(
        x=x,
        y=y,
        z=z,
        mode='markers',
        marker=dict(
            size=2,
            color=col,
            colorscale='Balance',
            opacity=0.8
        )
    )

    layout = go.Layout(
        scene=dict(
            xaxis=dict(title='X'),
            yaxis=dict(title='Y'),
            zaxis=dict(title='Z')
        )
    )
    fig = go.Figure(data=[trace], layout=layout)
    fig.show()

#--------- Diagrams ---------# 

def radar_methods_comparison(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'] , filename='radar_test.html', 
                                      N=10000, shape='torus', categories=['K1 mean', 'K2 mean', 'D1 mean', 'D2 mean', 'Timings (mean)'],
                                      option='slider_standard_dev', with_neighbors=False):

    if option == 'simple': 
        radar_methods_comp(data, methods, filename, N, shape, categories)
    elif option == 'standard_dev': 
        radar_methods_comp_standard_dev(data, methods, filename, N, shape, categories)
    elif option == 'slider_standard_dev':
        radar_methods_comp_standard_dev_slider(data, methods, filename, N, shape, categories, with_neighbors)


def radar_shapes_comparison(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'], filename='radar_shape.html',
                       N=10000, categorie='Mean curvature (mean)', 
                       option = 'slider_standard_dev', 
                       with_neighbors=False): 

    if option =='simple': 
        radar_shapes_comp(data, methods, filename, N, categorie)
    elif option == 'slider_standard_dev': 
        radar_shapes_comp_standard_dev_slider(data, methods, filename, N, categorie, with_neighbors)


#######################################################################################################################################


    ## /!\ Version sans slider ou standard deviation, de base. /!\

def radar_methods_comp(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'] , filename='radar_test.html', 
                                      N=10000, shape='torus', categories=['K1 mean', 'K2 mean', 'D1 mean', 'D2 mean', 'Timings (mean)']):

    # Filter data to keep only lines with N points and shape
    filtered_data = data[(data['N'] == N) & (data['Shape'] == shape)] if shape != 'all' else data[data['N'] == N]

    colors = {method: random_color[i] for i, method in enumerate(methods)}

    data_methods = []
    for method in methods:
        method_data = filtered_data[filtered_data['Method'] == method][categories].mean().tolist()
        # method_data = [np.log(x+1) for x in method_data]  # Add 1 before taking log
        method_data = [x for x in method_data]  # Add 1 before taking log
        method_data.append(method_data[0])  # To make it cyclic
        data_methods.append(method_data)

    categories.append(categories[0])  # Categories must also be cyclical

    # Creating the radar diagram
    fig = go.Figure(
        data=[
            go.Scatterpolar(r=data_methods[i], theta=categories, name=methods[i], line=dict(color=colors[methods[i]]), fill=None)
            for i in range(len(methods))
        ],
        layout=go.Layout(
            title=go.layout.Title(text=f'Methods comparison for {shape} shape with {N} points'),
            polar={'radialaxis': {'visible': True}},
            showlegend=True
        )
    )

    pyo.plot(fig, filename=filename)


   ## /!\ Version avec uniquement standard deviation 


def radar_methods_comp_standard_dev(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'], filename='radar_test.html', 
                                      N=10000, shape='torus', categories=['K1 mean', 'K2 mean', 'D1 mean', 'D2 mean', 'Timings (mean)']):
    
    # Filter data to keep only lines with N points and shape
    filtered_data = data[(data['N'] == N) & (data['Shape'] == shape)] if shape != 'all' else data[data['N'] == N]

    data_methods = []
    data_methods_std = []
    
    # colors = {method: generate_random_color() for method in methods}
    colors = {method: random_color[i] for i, method in enumerate(methods)}
    
    for method in methods:
        method_data = filtered_data[filtered_data['Method'] == method][categories].mean().tolist()
        method_data_std = filtered_data[filtered_data['Method'] == method][categories].std().tolist()
        
        # method_data = [np.log(x+1) for x in method_data]  # Add 1 before taking log
        # method_data_std = [np.log(x+1) for x in method_data_std]  # Add 1 before taking log
        method_data = [x for x in method_data]
        method_data_std = [x for x in method_data_std] 
        
        method_data.append(method_data[0])  # To make it cyclic
        method_data_std.append(method_data_std[0])  # To make it cyclic
        
        data_methods.append(method_data)
        data_methods_std.append(method_data_std)
    
    categories.append(categories[0])  # Categories must also be cyclical
    
    fig = go.Figure()
    
    # Adding the mean values and standard deviation bands
    for i, method in enumerate(methods):
        upper_bound = [r+std for r, std in zip(data_methods[i], data_methods_std[i])]
        lower_bound = [r-std for r, std in zip(data_methods[i], data_methods_std[i])]

        fig.add_trace(go.Scatterpolar(
            r=upper_bound + lower_bound[::-1],
            theta=categories + categories[::-1],
            name=f'{method} error band',
            fill='toself',
            fillcolor=colors[method].replace('1)', '0.2)'),
            line=dict(width=0, color=colors[method].replace('1)', '0)'))
        ))
        fig.add_trace(go.Scatterpolar(
            r=data_methods[i],
            theta=categories,
            name=method,
            line=dict(color=colors[method]),
            fill=None
        ))
    fig.update_layout(
        title=go.layout.Title(text=f'Methods comparison for {shape} shape with {N} points'),
        polar={'radialaxis': {'visible': True}},
        showlegend=True
    )
    
    pyo.plot(fig, filename=filename)


    ## /!\ Version test avec standard dev et slider : 


def radar_methods_comp_standard_dev_slider(data, 
                                           methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'], 
                                           filename='radar_test.html', N=10000, shape='torus', 
                                           categories=['K1 mean', 'K2 mean', 'D1 mean', 'D2 mean', 'Timings (mean)'],
                                           with_neighbors=False):

    # Get all unique radii from data
    radii = []
    if with_neighbors:
        radii = sorted(data['Nb neighbors (mean)'].unique())
    else :
        radii = sorted(data['Radius'].unique())

    fig = go.Figure()

    # Generate colors outside the main loop
    # colors = {method: generate_random_color() for method in methods}
    colors = {method: random_color[i] for i, method in enumerate(methods)}

    for r, radius in enumerate(radii):
        # Filter data to keep only lines with the radius and shape and with N points 
        filtered_data = []
        if with_neighbors:
            filtered_data = data[(data['N'] == N) & (data['Nb neighbors (mean)'] == radius) & (data['Shape'] == shape)] if shape != 'all' else data[(data['Nb neighbors (mean)'] == radius) & (data['N'] == N)]
        else:
            filtered_data = data[(data['N'] == N) & (data['Radius'] == radius) & (data['Shape'] == shape)] if shape != 'all' else data[(data['Radius'] == radius) & (data['N'] == N)]

        data_methods = []
        data_methods_std = []

        for method in methods:
            method_data = filtered_data[filtered_data['Method'] == method][categories].mean().tolist()
            method_data_std = filtered_data[filtered_data['Method'] == method][categories].std().tolist()

            # method_data = [np.log(x + 1) for x in method_data]  # Add 1 before taking log
            # method_data_std = [np.log(x + 1) for x in method_data_std]  # Add 1 before taking log
            method_data = [x for x in method_data]
            method_data_std = [x for x in method_data_std]
            method_data.append(method_data[0])  # To make it cyclic
            method_data_std.append(method_data_std[0])  # To make it cyclic

            data_methods.append(method_data)
            data_methods_std.append(method_data_std)

        categories.append(categories[0])  # Categories must also be cyclical

        # Adding the mean values and standard deviation bands
        for i, method in enumerate(methods):
            upper_bound = [m + std for m, std in zip(data_methods[i], data_methods_std[i])]
            lower_bound = [m - std for m, std in zip(data_methods[i], data_methods_std[i])]

            fig.add_trace(go.Scatterpolar(
                visible=False,
                r=upper_bound + lower_bound[::-1],
                theta=categories + categories[::-1],
                name=f'{method} error band',
                fill='toself',
                fillcolor=colors[method].replace('1)', '0.2)'),
                line=dict(width=0, color=colors[method].replace('1)', '0)'))
            ))
            fig.add_trace(go.Scatterpolar(
                visible=False,
                r=data_methods[i],
                theta=categories,
                name=method,
                line=dict(color=colors[method]),
                fill=None
            ))

    # Make the first set of data visible
    for i in range(len(methods) * 2):
        fig.data[i].visible = True

    # Creating slider steps
    steps = []
    for i, radius in enumerate(radii):
        step = dict(
            method='restyle',
            args=['visible', [False] * len(fig.data)],
            label=str(radius)
        )
        # Toggle i'th trace to "visible"
        for j in range(len(methods) * 2):
            step["args"][1][i*(len(methods) * 2) + j] = True
        steps.append(step)

    sliders = [dict(
        active=0,
        currentvalue={'prefix': 'Radius: '},
        steps=steps
    )]

    fig.update_layout(
        sliders=sliders,
        title=go.layout.Title(text=f'Methods comparison for {shape} shape with varying radius and {N} points'),
        polar={'radialaxis': {'visible': True}},
        showlegend=True
    )

    pyo.plot(fig, filename=filename)


#######################################################################################################################################

    ## /!\ Version sans slider, de base. /!\
    
def radar_shapes_comp(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'], filename='radar_shape.html',
                       N=10000, categorie='Mean curvature (mean)'):
    
    data_diag = data[data['N'] == N]

    # Data preparation for each method
    data_methods = []
    shapes = data_diag['Shape'].unique()

    colors = {method: random_color[i] for i, method in enumerate(methods)}

    for method in methods:
        method_data = data_diag[data_diag['Method'] == method].groupby('Shape')[categorie].mean()
        method_data = method_data.reindex(shapes)
        # method_data = [np.log(x + 1) for x in method_data]  # Add 1 before taking log
        method_data = [x for x in method_data]
        method_data.append(method_data[0])  # To make it cyclic
        data_methods.append(method_data)

    # Catégories
    categories = shapes.tolist()
    categories.append(categories[0])  # Categories must also be cyclical

    # Creating the radar diagram
    fig = go.Figure(
        data=[
            go.Scatterpolar(r=data_methods[i], theta=categories, name=methods[i], line=dict(color=colors[methods[i]]), fill=None)
            for i in range(len(methods))
        ],
        layout=go.Layout(
            title=go.layout.Title(text=f'Methods comparison, {categorie}, with {N} points'),
            polar={'radialaxis': {'visible': True}},
            showlegend=True
        )
    )
    print ("COUCOUCOUCOUCOUCOUCOUCOUC")
    fig.write_image("./fig.evg")

    # pyo.plot(fig, filename=filename)


def radar_shapes_comp_standard_dev_slider(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'], 
                             filename='radar_shape.html', N=10000, categorie='Mean curvature (mean)', with_neighbors=False):

    # Get all unique radii from data
    radii = []
    if with_neighbors:
        radii = sorted(data['Nb neighbors (mean)'].unique())
    else:
        radii = sorted(data['Radius'].unique())
    
    fig = go.Figure()

    # Generate colors outside the main loop
    # colors = {method: generate_random_color() for method in methods}
    colors = {method: random_color[i] for i, method in enumerate(methods)}

    
    for r, radius in enumerate(radii):
        if with_neighbors:
            data_diag = data[ (data['Nb neighbors (mean)'] == radius) & (data['N'] == N)]
        else:
            data_diag = data[(data['N'] == N) & (data['Radius'] == radius)]

        # Data preparation for each method
        data_methods = []
        data_methods_std = []
        shapes = data_diag['Shape'].unique()

        for method in methods:
            method_data = data_diag[data_diag['Method'] == method].groupby('Shape')[categorie].mean()
            method_data_std = data_diag[data_diag['Method'] == method].groupby('Shape')[categorie].std()

            # method_data = [np.log(x + 1) for x in method_data]  # Add 1 before taking log
            # method_data_std = [np.log(x + 1) for x in method_data_std]  # Add 1 before taking log
            method_data = [x for x in method_data]
            method_data_std = [x for x in method_data_std]
            method_data.append(method_data[0])  # To make it cyclic
            method_data_std.append(method_data_std[0])  # To make it cyclic

            data_methods.append(method_data)
            data_methods_std.append(method_data_std)

        # Categories
        categories = shapes.tolist()
        categories.append(categories[0])  # Categories must also be cyclical

        # Adding scatterpolar traces for each method
        for i, method in enumerate(methods):
            upper_bound = [m + std for m, std in zip(data_methods[i], data_methods_std[i])]
            lower_bound = [m - std for m, std in zip(data_methods[i], data_methods_std[i])]

            fig.add_trace(go.Scatterpolar(
                visible=(r==0),
                r=upper_bound + lower_bound[::-1],
                theta=categories + categories[::-1],
                name=f'{method} error band',
                fill='toself',
                fillcolor=colors[method].replace('1)', '0.2)'),
                line=dict(width=0, color=colors[method].replace('1)', '0)'))
            ))
            fig.add_trace(go.Scatterpolar(
                visible=(r==0),
                r=data_methods[i],
                theta=categories,
                name=method,
                line=dict(color=colors[method]),
                fill=None
            ))

   # Creating slider steps
    steps = []
    for i, radius in enumerate(radii):
        step = dict(
            method='restyle',
            args=['visible', [False] * len(fig.data)],  # Initialize all as invisible
            label=str(radius)
        )
        # Make current traces visible
        for j in range(len(methods) * 2):  # 2 traces per method now
            step["args"][1][i*(len(methods) * 2) + j] = True
        steps.append(step)

    sliders = [dict(
        active=0,
        currentvalue={'prefix': 'Radius: '},
        steps=steps
    )]

    fig.update_layout(
        sliders=sliders,
        title=go.layout.Title(text=f'Methods comparison, {categorie}, with {N} points'),
        polar={'radialaxis': {'visible': True}},
        showlegend=True
    )

    pyo.plot(fig, filename=filename)


#######################################################################################################################################

#------------------ Others diagrams ------------------#

def bar_shapes_comp(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'], filename='bar_shape.html',
                       N=10000, categorie='Mean curvature (mean)'):
    
    data_diag = data[data['N'] == N]    # Data preparation for each method
    data_means = []
    data_errors = []  # New list to store standard deviation data
    shapes = data_diag['Shape'].unique()    

    for method in methods:
        method_mean = data_diag[data_diag['Method'] == method].groupby('Shape')[categorie].mean()
        method_std = data_diag[data_diag['Method'] == method].groupby('Shape')[categorie].std()  # Calculating standard deviation        
        method_mean = method_mean.reindex(shapes)
        method_std = method_std.reindex(shapes)  # Ensuring standard deviation data is in the same order        
        method_mean = np.log(method_mean).tolist()
        method_std = np.log(method_std).tolist()  # Apply log to standard deviation as well        
        data_means.append(method_mean)
        data_errors.append(method_std)  # Add to list of standard deviation data    # Creating the bar chart
    
    fig = go.Figure(
        data=[
            go.Bar(name=methods[i], x=shapes, y=data_means[i],
                   error_y=dict(type='data',  # Include error_y parameter
                                array=data_errors[i],
                                visible=True))
            for i in range(len(methods))
        ]
    )
    
    fig.update_layout(
        barmode='group',
        title=go.layout.Title(text=f'Methods comparison, {categorie}, with {N} points'),
    )    

    pyo.plot(fig, filename=filename)


def violin_shapes_comp(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'], filename='violin_shape.html',
                       N=10000, categorie='Mean curvature (mean)'):

    data_diag = data[data['N'] == N]
    # Data preparation for each method
    data_list = []
    shapes = data_diag['Shape'].unique()
    for method in methods:
        method_data = data_diag[data_diag['Method'] == method][categorie]
        method_data = method_data.tolist()
        data_list.append(method_data)

    # Creating the violin plot
    fig = go.Figure()
    for i in range(len(methods)):
        # fig.update_layout(yaxis_type="log")
        fig.add_trace(go.Violin(y=data_list[i], name=methods[i],
                                box_visible=True,
                                meanline_visible=True))
        # put log scale on y-axis

    fig.update_layout(
        title=go.layout.Title(text=f'Methods comparison, {categorie}, with {N} points'),
        yaxis_zeroline=False
    )
    pyo.plot(fig, filename=filename)



    #---------------------- Diagram to test ----------------------#

def box_plot_methods_comp(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'], 
                        N=10000, shape='torus', category='K1 mean', filename='box_plot_test.html'):

    # Filter data to keep only lines with N points and shape
    filtered_data = data[(data['N'] == N) & (data['Shape'] == shape)] if shape != 'all' else data[data['N'] == N]

    fig = go.Figure()

    for method in methods:
        method_data = filtered_data[filtered_data['Method'] == method][category].values
        method_data=np.log(method_data)
        fig.add_trace(go.Box(y=method_data, name=method))

    fig.update_layout(title_text=f'Methods comparison for {shape} shape with {N} points',
                    yaxis_title=category)

    pyo.plot(fig, filename=filename)


def bar_chart_methods_comp(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'], 
                           N=10000, shape='torus', category='K1 mean', filename='bar_chart_test.html'):

    # Filter data to keep only lines with N points and shape
    filtered_data = data[(data['N'] == N) & (data['Shape'] == shape)] if shape != 'all' else data[data['N'] == N]

    fig = go.Figure()

    for method in methods:
        method_data = filtered_data[filtered_data['Method'] == method][category].mean()
        method_data=np.log(method_data)
        fig.add_trace(go.Bar(x=[method], y=[method_data], name=method))

    fig.update_layout(title_text=f'Methods comparison for {shape} shape with {N} points',
                      yaxis_title=category, xaxis_title='Method')

    pyo.plot(fig, filename=filename)

def scatter_plot_methods_comp(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'], 
                              N=10000, shape='torus', category='K1 mean', filename='scatter_plot_test.html'):

    # Filter data to keep only lines with N points and shape
    filtered_data = data[(data['N'] == N) & (data['Shape'] == shape)] if shape != 'all' else data[data['N'] == N]

    fig = go.Figure()

    for method in methods:
        method_data = filtered_data[filtered_data['Method'] == method][category].values
        method_data=np.log(method_data)
        fig.add_trace(go.Scatter(x=list(range(len(method_data))), y=method_data, mode='markers', name=method))

    fig.update_layout(title_text=f'Methods comparison for {shape} shape with {N} points',
                      yaxis_title=category, xaxis_title='Observation')

    pyo.plot(fig, filename=filename)


def heatmap_methods_comp(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'], 
                         N=10000, shapes=['torus', 'goursat', 'leopold'], category='K1 mean', 
                         filename='heatmap_test.html'):

    # Filter data to keep only lines with N points
    filtered_data = data[data['N'] == N]

    # Create an empty DataFrame for the heatmap
    heatmap_data = pd.DataFrame(index=methods, columns=shapes)

    # Calculate mean error for each method and shape
    for method in methods:
        for shape in shapes:
            mean_error = filtered_data[(filtered_data['Method'] == method) & (filtered_data['Shape'] == shape)][category].mean()
            heatmap_data.loc[method, shape] = mean_error

    # Create the heatmap
    fig = go.Figure(data=go.Heatmap(z=heatmap_data.values, x=heatmap_data.columns, y=heatmap_data.index))

    fig.update_layout(title_text=f'Methods comparison for {N} points', 
                      xaxis_title='Shape', yaxis_title='Method')

    pyo.plot(fig, filename=filename)


def scatter_3d_methods_comp(data, methods=['ASO','JetFitting','ASO_PONCA', 'APSS_PONCA','PLANE_PONCA'], 
                            N=10000, shape='torus', categories=['K1 mean', 'K2 mean', 'D1 mean'], 
                            filename='scatter_3d_test.html'):

    # Filter data to keep only lines with N points and shape
    filtered_data = data[(data['N'] == N) & (data['Shape'] == shape)] if shape != 'all' else data[data['N'] == N]

    fig = go.Figure()

    for method in methods:
        method_data = filtered_data[filtered_data['Method'] == method][categories]
        method_data=np.log(method_data)
        fig.add_trace(go.Scatter3d(x=method_data[categories[0]], 
                                   y=method_data[categories[1]], 
                                   z=method_data[categories[2]], 
                                   mode='markers', 
                                   name=method))

    fig.update_layout(title_text=f'Methods comparison for {shape} shape with {N} points', 
                      scene=dict(xaxis_title=categories[0], 
                                 yaxis_title=categories[1], 
                                 zaxis_title=categories[2]))

    pyo.plot(fig, filename=filename)



def radar_shape_image(data, output_name, categorie, color_map):
    
    data_diag = data
    methods = data_diag['Method'].unique()

    # Data preparation for each method
    data_methods = []
    shapes = data_diag['Shape'].unique()

    for method in methods:
        method_data = data_diag[data_diag['Method'] == method].groupby('Shape')[categorie].mean()
        method_data = method_data.reindex(shapes)
        # method_data = [np.log(x + 1) for x in method_data]  # Add 1 before taking log
        method_data = [x for x in method_data]
        method_data.append(method_data[0])  # To make it cyclic
        data_methods.append(method_data)

    # Catégories
    categories = shapes.tolist()
    categories.append(categories[0])  # Categories must also be cyclical

    # Creating the radar diagram
    fig = go.Figure(
        data=[
            go.Scatterpolar(r=data_methods[i], theta=categories, name=methods[i], line=dict(color=color_map[methods[i]]), fill=None)
            for i in range(len(methods))
        ],
        layout=go.Layout(
            title=go.layout.Title(text=f'Methods comparison by shapes for the error on {categorie}'),
            polar={'radialaxis': {'visible': True}},
            showlegend=True
        )
    )
    fig.write_image(output_name)

def radar_estim_image(data, output_name, categories, color_map, range_max=1.0):
    
    data_diag = data
    methods = data_diag['Method'].unique()

    # Data preparation for each method
    data_methods = []
    shapes = data_diag['Shape'].unique()

    for method in methods:
        method_data = data_diag[data_diag['Method'] == method][categories].mean().tolist()
        # method_data = [np.log(x + 1) for x in method_data]  # Add 1 before taking log
        method_data = [x for x in method_data]
        method_data.append(method_data[0])  # To make it cyclic
        data_methods.append(method_data)

    # Catégories
    categories.append(categories[0])  # Categories must also be cyclical

    # Creating the radar diagram
    fig = go.Figure(
        data=[
            go.Scatterpolar(r=data_methods[i], theta=categories, name=methods[i], line=dict(color=color_map[methods[i]]), fill=None)
            for i in range(len(methods))
        ],
        layout=go.Layout(
            title=go.layout.Title(text=f'Methods comparison for each category'),
            polar={'radialaxis': {'visible': True}}#,
            # showlegend=True
        )
    )
    # fig.update_layout(legend=dict(x=0.9, y=0.9), autosize=True)
    fig.update_layout(legend=dict( yanchor="top", y=0.01, xanchor="left", x=0.99 ), autosize=True)

    # Rescale the axis to show the error between 0 and 1.5
    fig.update_layout(polar=dict(radialaxis=dict(range=[0, range_max])))
    # change the position of the legend and upscale the entire figure
    
    fig.write_image(output_name)

dash_patterns = [
    'solid',
    'longdash',
    'dash',
    '5px,10px',  # Tiret de 5px, espace de 10px
    'longdashdot',
    '10px,5px,2px,5px',  # Motif plus complexe
    'dashdot',
    'dot',
]

def create_subplots(dataset, rows, cols, to_legend, colors, line_width=1.5, split_by=None):
    """
    Rows are configured as : 
    [
        ( "constraint", [the constrained row's param], "x", "x_label")
    ]
    Cols are configured as : 
    [
        ( "constraint", [the constrained col's param], "y", "y_label", "log")
    ]
    """

    subplot_data = []

    displayed_legend = set()

    for i, row in enumerate(rows) :
        data_row = dataset[dataset[row[0]].isin(row[1])]
        # if data_row contains the dataset column, then check 
        for j, col in enumerate(cols) :
            data_col = data_row[data_row[col[0]].isin(col[1])]
            if to_legend == "Method" :
                data_col = data_col[data_col["Method"].isin(properties[col[2]])]
            traces = []
            for legend in data_col[to_legend].unique() :
                data_legend = data_col[data_col[to_legend] == legend]
                
                showlegend = legend not in displayed_legend
                if showlegend :
                    displayed_legend.add(legend)
                
                x_datas = []
                y_datas = []
                lines = []
                line_names = []
                
                if split_by is not None :
                    for s_idx, split in enumerate( data_legend[split_by].unique() ) :
                        data_split = data_legend[data_legend[split_by] == split]
                        x_data = sorted(data_split[row[2]].unique())
                        y_data = data_split[col[2]].groupby(data_split[row[2]]).mean()
                        x_datas.append(x_data)
                        y_datas.append(y_data)
                        lines.append(dict(color=colors[legend], dash=dash_patterns[s_idx % len(dash_patterns)]) if (s_idx > 0) else dict(color=colors[legend]))
                        line_names.append(f"{legend}_{split}")
                else :
                    x_datas = [sorted(data_legend[row[2]].unique())]
                    y_datas = [data_legend[col[2]].groupby(data_legend[row[2]]).mean()]
                    lines = [dict(color=colors[legend], width=line_width)]
                    line_names = [legend]

                for x_data, y_data, line, name in zip(x_datas, y_datas, lines, line_names) :
                    traces.append(
                        dict(
                            x=x_data, 
                            y=y_data, 
                            mode='lines', 
                            name=name, 
                            legendgroup=name,
                            showlegend=showlegend,
                            line=line,
                            marker=dict(color=colors[legend])
                        )
                    )

            subplot_data.append(
            {
                'title': "",
                'traces': traces,
                'x_title': row[3],
                'y_title': col[3],
                'x_basename' : row[2],
                'y_basename' : col[2],
                'row': i+1,
                'col': j+1, 
                'y_axis_type': "linear" if len(col) < 5 else col[4],
            })
    return subplot_data


def is_shared_axis(subplot_data, max_rows, max_cols):
    x_axis = [
        "" for _ in range(max_rows)
    ]
    y_axis = [
        "" for _ in range(max_cols)
    ]
    for data in subplot_data :
        x_axis[data['row']-1] = data['x_basename']
        y_axis[data['col']-1] = data['y_basename']
    shared_x = True
    shared_y = True
    for i in range(max_rows-1) :
        if x_axis[i] != x_axis[i+1] :
            shared_x = False
            break
    for i in range(max_cols-1) :
        if y_axis[i] != y_axis[i+1] :
            shared_y = False
            break
    return shared_x, shared_y

base_fonts = {
    'title_font': 18,
    'axis_title_font': 15,
    'axis_tick_font': 10,
    'annotation_font': 15,
    'legend_font' : 12,
    'font_factor': 1.35,
    'font_family': 'Times New Roman',
}

def get_legend_height (list_legend, width, fonts, font_heights, show_titles):
    char_width = fonts['legend_font'] * 0.6
    char_height = font_heights['legend_height']
    bar_width = 30
    spacing = 30 if show_titles else 0
    total_length = 0
    for legend in list_legend :
        total_length += ( len(legend) * char_width ) + spacing + bar_width
    return ( ( math.ceil(total_length / width) ) * char_height ) + bar_width * 2 

def get_font_height (fonts, showtitles) :
    font_heights = {
        'title_height': fonts['title_font'] * fonts['font_factor'] if showtitles else fonts['annotation_font'] * fonts['font_factor'],
        'axis_title_height': fonts['axis_title_font'] * fonts['font_factor'] if showtitles else 0,
        'axis_tick_height': fonts['axis_tick_font'] * fonts['font_factor'],
        'annotation_height': fonts['annotation_font'] * fonts['font_factor'],
        'legend_height': fonts['legend_font'] * fonts['font_factor'] if showtitles else 0,
    }
    return font_heights

def find_titles (subplot_data, max_rows, max_cols, show_titles) :
    x_names = [ ["" for _ in range(max_cols)] for _ in range(max_rows) ]
    y_names = [ ["" for _ in range(max_cols)] for _ in range(max_rows) ]

    titles = []
    for data in subplot_data:
        row, col = data.get('row', 1), data.get('col', 1)
        x_names[row-1][col-1] = data['x_title'] if show_titles else ""
        y_names[row-1][col-1] = data['y_title'] if show_titles else ""
        
        if show_titles:
            titles.append(data['title'])
        else : 
            if data.get('row', 1) == 1 :
                titles.append(data['y_title'])
            else :
                titles.append("")

    return x_names, y_names, titles

def simplify_axis_name (fig, x_names, y_names, max_rows, max_cols, collapse_x, collapse_y) :
    for col in range(max_cols) :
        same = False
        for row in range(max_rows) :
            if x_names[row][col] == x_names[0][col] :
                same = True
            else :
                same = False
                break
        if same and collapse_x :
            for row in range(max_rows-1) :
                fig.update_xaxes(title_text="", row=row+1, col=col+1)

    for row in range(max_rows) :
        same = False
        for col in range(max_cols) :
            if y_names[row][col] == y_names[row][0] :
                same = True
            else :
                same = False
                break
        if same and collapse_y :
            for col in range(1, max_cols) :
                fig.update_yaxes(title_text="", row=row+1, col=col+1)
    return fig

def create_modular_subplots(subplot_data, title=None, page_width=718.75, graph_ratio=0.8, fonts=base_fonts, margin_percent=4, show_titles=True, collapse_x=False, collapse_y=False):

    font_heights = get_font_height (fonts, show_titles)
    max_rows = max(data.get('row', 1) for data in subplot_data)
    max_cols = max(data.get('col', 1) for data in subplot_data)

    margin_px = page_width * (margin_percent / 100)
    available_width = page_width - 2 * margin_px
    column_widths = [1/max_cols] * max_cols
    subgraph_height = (available_width / max_cols) * graph_ratio
    total_graph_height = subgraph_height * max_rows


    total_height = (
        2 * margin_px +
        font_heights['title_height'] +
        total_graph_height +
        ( ( font_heights['axis_title_height'] + font_heights['axis_tick_height'] ) * ( max_rows + 1) )
    )
    row_heights = [ ( subgraph_height ) / total_height] * max_rows

    x_names, y_names, titles = find_titles(subplot_data, max_rows, max_cols, show_titles)
    is_shared_x, is_shared_y = is_shared_axis(subplot_data, max_rows, max_cols)

    fig = sp.make_subplots( rows=max_rows, cols=max_cols,
        column_widths=column_widths, row_heights=row_heights,
        shared_xaxes=is_shared_x & collapse_x,
        shared_yaxes=is_shared_y & collapse_y,
        horizontal_spacing=0.08 if show_titles else 0.05, 
        vertical_spacing=0.05 if show_titles else 0.05,
        subplot_titles=titles,
    )
    legend_names = []
    
    for data in subplot_data:
        row, col = data.get('row', 1), data.get('col', 1)
        
        for trace in data['traces']:
            fig.add_trace(go.Scatter(**trace), row=row, col=col)
            
            if trace['name'] not in legend_names:
                legend_names.append(trace['name'])
                
        fig.update_xaxes(title_text=x_names[row-1][col-1], row=row, col=col,
                        title_font=dict(size=fonts['axis_title_font']),
                        gridcolor="whitesmoke",
                        # dtick=25,
                        showgrid=True,
                        tickfont=dict(size=fonts['axis_tick_font']))
        fig.update_yaxes(title_text=y_names[row-1][col-1], row=row, col=col,
                        type=data.get('y_axis_type', 'linear'),
                        title_font=dict(size=fonts['axis_title_font']),
                        gridcolor="whitesmoke",
                        # dtick=25,
                        showgrid=True,
                        tickfont=dict(size=fonts['axis_tick_font']))
        
        for i in fig['layout']['annotations']:
            i['font'] = dict(size=fonts['annotation_font'], family=fonts['font_family'])
        
    fig = simplify_axis_name (fig, x_names, y_names, max_rows, max_cols, collapse_x, collapse_y)

    legend_height = get_legend_height (legend_names, available_width, fonts, font_heights, show_titles)
    total_height += legend_height

    # Appliquer les paramètres de mise en page globale
    fig.update_layout(
        font=dict(family=fonts['font_family']),
        plot_bgcolor='white',
        
        title = dict( text = title if show_titles else "", font = dict(size=fonts['title_font'], family=fonts['font_family']) ),
        width=page_width,
        height=total_height,
        showlegend=True,
        legend=dict(
            orientation='h',
            itemsizing='constant',
            y= - ( font_heights['axis_title_height'] + font_heights['axis_tick_height'] ) / ( total_graph_height ),
            x=0,
            font=dict(size=fonts['legend_font'], family=fonts['font_family']),
        ),
        margin=dict(l=margin_px, r=margin_px, t= ( show_titles * margin_px ) + font_heights['title_height'], b=margin_px + legend_height),
    )

    return fig

