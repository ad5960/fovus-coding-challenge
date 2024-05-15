import boto3
import os

# Variables
id = "MZFrHT8JSIbvMEQ_RXXYv"
output_filename = '/home/ec2-user/OutputFile.txt'
bucket_name = 'fovus-challenge-bucket1'

# Initialize the boto3 clients
dynamo_client = boto3.client('dynamodb', region_name='us-east-1')
s3_client = boto3.client('s3', region_name='us-east-1')
print("Clients initialised")

# Fetch item from DynamoDB
response = dynamo_client.get_item(
    TableName='s3-file-info-table',
    Key={'id': {'S': id}}
)

if 'Item' not in response:
    print(f"No item found with ID {id}")
    exit()  # Exit if no item found

item = response['Item']
file_path = item['file_path']['S']
if file_path.startswith(f's3://{bucket_name}/'):
    file_path = file_path.replace(f's3://{bucket_name}/', '')
print(f"File Path extracted: {file_path}")

input_text = item['input_text']['S']
print("dynamo db items fetched")
print("Bucket:", bucket_name)
print("File Path:", file_path)
print("input_text:", input_text)

# Download the file from S3 to append text
try:
    s3_client.download_file(bucket_name, file_path, output_filename)
    print("input file downloaded")
except s3_client.exceptions.NoSuchKey:
    print(f"The file {file_path} does not exist in the bucket {bucket_name}.")
    exit()  # Stop further execution if file not found
except Exception as e:
    print("An unexpected error occurred:", e)
    exit()  # Stop further execution on other errors

# Append text to the file
if os.path.exists(output_filename):
    print("Appending to existing file.")
    with open(output_filename, 'a') as file:
        file.write("\n"+input_text + "\n")
        print("Text appended.")
else:
    print("Creating new file because it does not exist.")
    with open(output_filename, 'w') as file:
        file.write(input_text + "\n")
        print("Text appended.")

# Upload the modified file back to S3
new_s3_path = 'output/OutputFile.txt'  # Modify as needed
try:
    s3_client.upload_file(output_filename, bucket_name, new_s3_path)
    print("output file uploaded")
except Exception as e:
    print("Failed to upload file:", e)
    exit()  # Stop further execution on upload error

# Update DynamoDB with the new file path
try:
    dynamo_client.update_item(
        TableName='s3-outputFile-info-table',
        Key={'id': {'S': '1'}},
        UpdateExpression='SET outPut_file_path = :val1',
        ExpressionAttributeValues={
            ':val1': {'S': f's3://{bucket_name}/{new_s3_path}'}
        }
    )
    print("DynamoDB updated")
except Exception as e:
    print("Failed to update DynamoDB:", e)
