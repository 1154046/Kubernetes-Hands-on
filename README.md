# Kubernetes-Hands-on
This is a hands on lab which demonstrates the usage of Kubernetes clusters in a local and remote environment


As a developer, you want to rapidly iterate on your application source code locally while still mirroring a remote production environment as closely as possible. 

This tutorial describes how you can set up a single-node Kubernetes cluster locally by using Minikube and deploy an application to it. Then it shows how to do the same steps with the IBM Cloud Kubernetes Service on the IBM Cloud. 

Finally, you learn to set up a multi-node cluster locally by using kubeadm-dind-cluster and remotely with IBM Cloud Kubernetes Service.

In this tutorial, you learn how to perform the following tasks:

    Create a local single-node cluster using Minikube.
    Create a local multi-node cluster using kubeadm-dind-cluster.
    Create remote single-node and multi-node clusters using IBM Cloud Kubernetes Service.
    Make images available to your local and remote clusters.
    Access your running application in your local and remote clusters.
    Modify and re-deploy your application.

## Prerequisites

Before you begin, you need to install the required CLIs to create and manage your Kubernetes clusters and to deploy containerized applications to your cluster. 

IBM provides an installer here to get all of these tools together. There are instructions for how to obtain the tools manually, if desired.

The following tools are used in this tutorial:

    git: git is a version control system that we’ll use to obtain the source of a sample application.
    Docker: Docker is a tool that allows developers to build and run an application as a lightweight, portable container.
    kubectl CLI: kubectl is a command line interface for running commands against Kubernetes clusters.
    ibmcloud CLI: ibmcloud is a command line interface for managing resources in IBM Cloud.

## Estimated time

Completing this tutorial should take approximately 90 minutes.


## Steps

### 1. Download the sample application

The application that we use in this tutorial is a simple guestbook website where users can post messages. 
You should clone it to your workstation since you’ll be building it locally.

$ git clone https://github.com/IBM/guestbook

### 2.  Set up a local single-node cluster using Minikube

Minikube is a tool that makes it easy to run Kubernetes locally. Minikube runs a single-node Kubernetes cluster inside a VM on your workstation.

Install Minikube on your workstation: https://kubernetes.io/docs/tasks/tools/install-minikube/

#### Create a cluster

Use the minikube start command to start a cluster. It creates a virtual machine on your workstation and installs Kubernetes onto it. Note that if you are using a hypervisor other than VirtualBox, then you will need to pass an additional argument --vm-driver to identify the appropriate VM driver.

Rename the minikube downloaded exe to minikube.exe, then either use the minikube.exe in your directory or add a minikube PATH in your environment variables.

run $ minikube start in your terminal. 

##### Minikube configures the kubectl CLI to work with this cluster. 
You can verify by entering a kubectl command, like this: $ kubectl get nodes

#### Deploy the application to your local cluster

Kubernetes deployments are designed to pull images from a container registry. However, for local development you can avoid the extra step of pushing images to a registry by pointing your docker CLI to the docker daemon running inside minikube.

$ eval $(minikube docker-env)

If you now enter docker ps you will see all of the containers running inside minikube.

##### Note: The effect of the eval command is limited to the current command window. If you close and re-open the window then you will need to repeat this command.

Let’s go ahead and build the guestbook application: 
$ cd guestbook/v1/guestbook
$ docker build -t guestbook:v1 .

Note that the image was given the tag v1. You should not use the latest tag, because this will make Kubernetes try to pull the image from a public registry. We want it to use the locally stored image.

The guestbook image is now present in the minikube cluster so we’re ready to run it:
$ kubectl run guestbook --image=guestbook:v1

We can use kubectl to verify that Kubernetes created a pod containing our container and that it’s running:
$ kubectl get pods

#### Access the running application

The guestbook application listens on port 3000 inside the pod. In order to make the application externally accessible, we need to create a Kubernetes service of type NodePort for it. Kubernetes will allocate a port in the range 30000-32767 and the node will proxy that port to the pod’s target port.

$ kubectl expose deployment guestbook --type=NodePort --port=3000


In order to access the service, we need to know the IP address of Minikube’s virtual machine and the node port number. Minikube provides a convenient way for getting this information.

$ minikube service guestbook --url

The IP address and port number on your workstation obviously may be different. You can copy and paste the url that you get into your browser and the guestbook application should appear. You can also leave off the --url option and minikube will open your default browser with the url for you.


### Modify the application

Let’s make a simple change to the application and redeploy it. Open the file public/script.js in vi or your favorite editor. Modify the handleSubmission function so that it has an additional statement to append the date to the entry value, ensure it is the same as the file (script.js) in the public folder.
  
  
Now rebuild the docker image and assign it a new tag:

$ docker build -t guestbook:v1.1 .


After the image is built, we need to tell Kubernetes to use the new image:

$ kubectl set image deployment/guestbook guestbook=guestbook:v1.1

Refresh the guestbook application in your browser. (You may have to reload the page to get the updated javascript file.) Try entering something in the form and clicking “Submit.” You should see the text that you entered, followed by the current time appear on the page.


### 3. Set up a remote single-node cluster using the IBM Cloud Kubernetes Service

Now look at continuing our application development on IBM Cloud. If you have not already registered for an IBM Cloud account, do so here. The steps in this section can be done with a free Lite account. (The cluster that you create expires after one month.)

Log in to the IBM Cloud CLI and enter your IBM Cloud credentials:

$ ibmcloud login

##### Note: If you have a federated ID, use ibmcloud login --sso to log in to the IBM Cloud CLI.

#### Create a cluster

Create a Kubernetes cluster:
$ ibmcloud ks cluster-create --name mycluster

Cluster creation continues in the background. You can check the status:
$ ibmcloud ks clusters

If the cluster state is pending, wait for a moment and try the command again. Once the cluster is provisioned (i.e., state is normal), the Kubernetes client CLI kubectl needs to be configured to talk to the provisioned cluster.

Run ibmcloud ks cluster-config mycluster, which creates a config file on your workstation:
$ ibmcloud ks cluster-config mycluster

Copy the export statement and run it. It sets the KUBECONFIG environment variable to point to the kubectl config file and makes your kubectl client work with your new Kubernetes cluster.

You can verify that by entering a kubectl command:
$ kubectl get nodes


#### Deploy the application to your remote cluster

In order for Kubernetes to pull images to run in the cluster, the images need to be stored in an accessible registry. You can use the IBM Cloud Kubernetes Service to push Docker images to your own private registry.

First add a namespace to create your own image repository. (A namespace is a unique name to identify your private image registry.)

Replace <my_namespace> with your preferred namespace.

$ ibmcloud cr namespace-add <my_namespace>


The created registry name has the format registry.<region>.bluemix.net/<your_namespace> where <region> depends upon the region where your IBM Cloud account was created. You can find this out by running the ibmcloud cr region command.

$ ibmcloud cr region

Before you can push an image into the registry, you need to run the ibmcloud cr login command to log your local Docker daemon into the IBM Cloud Container Registry.

$ ibmcloud cr login

You can now tag our current local image (which you built previously while deploying to minikube) to associate it with the private registry and push it to the registry. Be sure to substitute <region> and <my_namespace> with the proper values.

$ docker tag guestbook:v1.1 registry.<region>.bluemix.net/<my_namespace>/guestbook:v1.1
$ docker push registry.<region>.bluemix.net/<my_namespace>/guestbook:v1.1

To run the application, use the same kubectl run command as before, except now refer to the image in the private repository:

$ kubectl run guestbook --image=registry.<region>.bluemix.net/<my_namespace>/guestbook:v1

You can use kubectl to verify that Kubernetes created a pod containing our container and that it’s running:

$ kubectl get pods


#### Accessing the running application

The guestbook application listens on port 3000 inside the pod. To make the application externally accessible, you need to create a Kubernetes service of type NodePort for it. Kubernetes allocates a port in the range 30000-32767 and the node proxies that port to the pod’s target port.

$ kubectl expose deployment guestbook --type=NodePort --port=3000

To access the service, you need to know the public IP address of the node where the application is running and the node port number that Kubernetes assigned to the service.

Get the IP address:
$ ibmcloud ks workers mycluster

Get the node port number:
$ kubectl describe services/guestbook

The application can be accessed from a browser by using the URL http://IPAddress:NodePortNumber/

### Scale the number of pods

Of course, the reason for having a cluster is to increase capacity and improve availability by placing copies of an application on multiple nodes. Kubernetes calls these copies “replicas.”

Now tell Kubernetes that we want two replicas of the application:
$ kubectl scale --replicas=2 deployment guestbook

Kubernetes works in the background to start an additional pod to make the total number of pods equal to 2.

You can check the status of this by running the kubectl get deployments command:
$ kubectl get deployments

You can also see the status of the pods and which nodes they are running on:
$ kubectl get pods -o wide

