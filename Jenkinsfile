pipeline {
    agent any
    environment {
        DOCKER_HUB_REPO = "soyoonjeong2328/ezpay"  // Docker Hub Repo 설정
    }
    stages {
        stage('Clone Repository') {
            steps {
                git 'https://github.com/soyoonjeong2328/EzPay.git'
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

        stage('Docker Login') {
            steps {
                withCredentials([string(credentialsId: 'DOCKER_HUB_PASSWORD', variable: 'DOCKER_HUB_PASSWORD')]) {
                    sh 'echo $DOCKER_HUB_PASSWORD | docker login -u soyoonjeong2328 --password-stdin'
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                sh '''
                echo "🐳 Building and pushing Docker image..."
                docker build -t $DOCKER_HUB_REPO:latest .
                docker push $DOCKER_HUB_REPO:latest
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                echo "🚀 Deploying application..."
                docker stop my_app || true
                docker rm my_app || true
                docker run -d --name my_app -p 8080:8080 $DOCKER_HUB_REPO:latest
                '''
            }
        }
    }
}
