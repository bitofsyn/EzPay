pipeline {
    agent any

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }
        // 테스트 실행 단계 추가
        stage('Run Tests') {
            steps {
                bat './gradlew test --no-daemon'
            }
        }

       // Docker 이미지 빌드
        stage('Build Docker Image') {
            steps {
                bat 'docker build -t ezpay-app:latest .'
            }
        }

        // 기존 컨테이너 중단 및 제거
        stage('Stop and Remove Previous Container') {
            steps {
                bat '''
                docker stop my_spring_app || echo "Container not found"
                docker rm my_spring_app || echo "No such container"
                '''
            }
        }

        // 새로운 컨테이너 실행
        stage('Run Docker Container') {
            steps {
                bat 'docker run -d -p 8080:8080 --name my_spring_app ezpay-app:latest'
            }
        }
    }
}