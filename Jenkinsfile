pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "myapp:latest"
        CONTAINER_NAME = "myapp-container"
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }
        stage('Build Docker Image') {
            steps {
                sh '''
                echo "🐳 Building Docker Image..."
                docker build -t $DOCKER_IMAGE .
                '''
            }
        }
        stage('Stop & Remove Existing Container') {
            steps {
                sh '''
                echo "🛑 Stopping existing container (if running)..."
                docker ps -q --filter "name=$CONTAINER_NAME" | grep -q . && docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME || true
                '''
            }
        }
        stage('Run Docker Container') {
            steps {
                sh '''
                echo "🚀 Running new Docker container..."
                docker run -d -p 8081:8080 --name $CONTAINER_NAME $DOCKER_IMAGE
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Build & Deployment Successful!"
        }
        failure {
            echo "❌ Build or Deployment Failed!"
        }
    }
}