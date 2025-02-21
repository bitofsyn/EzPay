pipeline {
    agent any

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }
        stage('Build Docker Image') {
            steps {
                bat 'docker build -t ezpay-app:latest .'
            }
        }
        stage('Stop and Remove Previous Container') {
            steps {
                bat '''
                docker stop my_spring_app || echo "Container not found"
                docker rm my_spring_app || echo "No such container"
                '''
            }
        }
        stage('Run Docker Container') {
            steps {
                bat 'docker run -d -p 8080:8080 --name my_spring_app ezpay-app:latest'
            }
        }
    }
}
