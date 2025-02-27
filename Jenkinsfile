pipeline {
    agent any
    environment {
        DOCKER_IMAGE = "ezpay-app:latest"
        DOCKER_HUB_REPO = "soyounjeong/ezpay"
        DOCKER_HUB_USERNAME = credentials('DOCKER_HUB_USERNAME')
        DOCKER_HUB_PASSWORD = credentials('DOCKER_HUB_PASSWORD')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'master', url: 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }

        stage('Build Gradle Project') {
             steps {
                sh '''
                chmod +x gradlew
                ./gradlew clean build
                '''
             }
        }

        stage('Docker Build & Push') {
            steps {
                sh 'echo "🐳 Building and pushing Docker image..."'
                sh "docker build -t $DOCKER_HUB_REPO:$BUILD_NUMBER ."
                sh "echo $DOCKER_HUB_PASSWORD | docker login -u $DOCKER_HUB_USERNAME --password-stdin"
                sh "docker tag $DOCKER_HUB_REPO:$BUILD_NUMBER $DOCKER_HUB_REPO:latest"
                sh "docker push $DOCKER_HUB_REPO:$BUILD_NUMBER"
                sh "docker push $DOCKER_HUB_REPO:latest"
            }
        }dp
        stage('Deploy') {
            steps {
                sh 'echo "🚀 Deploying to server..."'
                sh '''
                docker-compose down
                docker-compose up -d
                '''
            }
        }
    }
}