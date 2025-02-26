pipeline {
    agent any
    environment {
        POSTGRES_PASSWORD = credentials('POSTGRES_PASSWORD')
    }
    stages {
        stage('Clone Repository') {
            steps {
                git 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }
        stage('Prepare Environment') {
            steps {
                script {
                    // .env 파일을 Jenkins 워크스페이스에 생성
                    sh '''
                    echo "POSTGRES_USER=postgres" > .env
                    echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}" >> .env
                    echo "POSTGRES_URL=jdbc:postgresql://postgres:5432/postgres" >> .env
                    '''
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                sh 'docker-compose build'
            }
        }
        stage('Stop Existing Containers') {
            steps {
                sh 'docker-compose down'
            }
        }
        stage('Run Containers') {
            steps {
                sh 'docker-compose up -d --remove-orphans'
            }
        }
        stage('Check Running Containers') {
            steps {
                sh 'docker ps'
            }
        }
    }
}