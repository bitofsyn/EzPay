pipeline {
    agent any
    environment {
        DOCKER_IMAGE = "myapp:latest"
        DOCKER_HUB_REPO = "mydockerhub/myapp"
        DOCKER_HUB_USERNAME = credentials('DOCKER_HUB_USERNAME')
        DOCKER_HUB_PASSWORD = credentials('DOCKER_HUB_PASSWORD')
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/soyoonjeong2328/EzPay.git'
            }
        }
        stage('Build') {
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }
        stage('Docker Build & Push') {
            steps {
                sh "docker build -t $DOCKER_HUB_REPO:$BUILD_NUMBER ."
                sh "echo $DOCKER_HUB_PASSWORD | docker login -u $DOCKER_HUB_USERNAME --password-stdin"
                sh "docker tag $DOCKER_HUB_REPO:$BUILD_NUMBER $DOCKER_HUB_REPO:latest"
                sh "docker push $DOCKER_HUB_REPO:$BUILD_NUMBER"
                sh "docker push $DOCKER_HUB_REPO:latest"
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                docker-compose down
                docker-compose up -d
                '''
            }
        }
    }
}