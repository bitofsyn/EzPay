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

        stage('Clean Up Docker') {  // ✅ 기존 컨테이너 삭제
            steps {
                script {
                    sh '''
                    docker-compose down --remove-orphans
                    docker ps -q | xargs -r docker stop
                    docker ps -aq | xargs -r docker rm -f
                    '''
                }
            }
        }

        stage('Build & Deploy') {  // ✅ 새로 빌드 후 실행
            steps {
                script {
                    sh 'docker-compose up -d --build'
                }
            }
        }

        stage('Verify Deployment') {  // ✅ 컨테이너 실행 상태 확인
            steps {
                script {
                    sh 'docker ps -a'
                    sh 'docker logs my_spring_app'
                }
            }
        }
    }

    post {
        failure {
            sh 'docker-compose logs'
        }
    }
}