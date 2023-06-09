import { useState, useEffect } from "react";
import { createStyles } from "@mantine/core";

import {
  NumberInput,
  Select,
  Textarea,
  TextInput,
  Title,
  Group,
  Text,
  useMantineTheme,
  rem,
  Image,
  Button,
} from "@mantine/core";
import {
  Dropzone,
  DropzoneProps,
  FileWithPath,
  IMAGE_MIME_TYPE,
} from "@mantine/dropzone";
import { IconUpload, IconPhoto, IconX } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import Navbar from "../../../../components/Navbar";
import { storage } from "../../firebase";
import {
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL,
} from "firebase/storage";
import { v4 } from "uuid";

import { Montserrat } from "next/font/google";
import { Inter } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

export const speciesData = [
  { value: "Dog", label: "Dog" },
  { value: "Cat", label: "Cat" },
  { value: "Fish", label: "Fish" },
  { value: "Lizatd", label: "Lizard" },
  { value: "Rabbit", label: "Rabbit" },
  { value: "Hamster", label: "Hamster" },
  { value: "Rat", label: "Rat" },
];

export const locationData = [
  { value: "North Davis", label: "North Davis" },
  { value: "South Davis", label: "South Davis" },
  { value: "West Davis", label: "West Davis" },
  { value: "East Davis", label: "East Davis" },
  { value: "Downtown Davis", label: "Downtown Davis" },
  { value: "On Campus", label: "On Campus" },
];

interface FormData {
  name: string;
  description: string;
  species: string;
  breed: string;
  age: number;
  owner: string | null | undefined;
  location: string;
  availability: boolean;
  numDays: number;
  images: string[];
}

export default function CreateListing() {
  const { classes } = useStyles();
  const router = useRouter();
  const { user } = useUser();
  const theme = useMantineTheme();

  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    species: "",
    breed: "",
    age: 0,
    owner: user ? user.sub : "",
    location: "",
    availability: true,
    numDays: 0,
    images: [],
  });

  const handleSubmit = async () => {
    console.log(form);
    try {
      await fetch("http://localhost:4000/api/pets/", {
        body: JSON.stringify(form),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      console.log("Submitted Listing");
      router.push("/petdisplay");
      alert("Successfully Listed!");
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    console.log(form);
  }, [form]);

  const onSelectFile = async (input: FileWithPath[]) => {
    if (input.length + form.images.length > 5) {
      return;
    }
    const images = input.map(async (file) => {
      const imageRef = ref(storage, `images/${file.name + v4()}`);
      uploadBytes(imageRef, file).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((url) => {
          setForm({ ...form, images: [...form.images, url] });
        });
      });
    });
  };

  const deleteImage = (image) => {
    // Remove the image from Firebase Storage
    const fileName = decodeURIComponent(image)
      .split("/images/")[1]
      .split("?")[0];
    const imageRef = ref(storage, `images/${fileName}`);
    deleteObject(imageRef)
      .then(() => {
        console.log(`Successfully deleted image: ${image}`);
        // Update the form state by removing the deleted image
        setForm({
          ...form,
          images: form.images.filter((e) => e !== image),
        });
      })
      .catch((error) => {
        console.log(`Error deleting image: ${image}`, error);
      });
  };

  return (
    <div className={classes.container}>
      <Navbar />
      <br />
      <div className={classes.header}>
        <Text className={montserrat.className}>List Your Pet</Text>
      </div>

      <br />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className={classes.cardContainer}>
          <div className={classes.card}>
            <div className={classes.topHalf}>
              <div className={classes.topLeft}>
                <Dropzone
                  onDrop={onSelectFile}
                  onReject={() => {
                    console.log("Error in uploading");
                  }}
                  maxSize={5 * 1024 ** 2}
                  maxFiles={5}
                  accept={IMAGE_MIME_TYPE}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "200px",
                    height: "200px",
                    borderRadius: "8px",
                  }}
                >
                  <Group>
                    <Dropzone.Accept>
                      <IconUpload size="3.2rem" stroke={1.5} />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX size="3.2rem" stroke={1.5} />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconPhoto size="3.2rem" stroke={1.5} />
                    </Dropzone.Idle>
                    <div>
                      <Text size="xl" inline>
                        Drag images here or click to select files
                      </Text>
                      <Text size="sm" color="dimmed" inline mt={7}>
                        Attach up to 5 files. Each file should not exceed 5 MB.
                      </Text>
                    </div>
                  </Group>
                </Dropzone>
                {form.images.length > 0 &&
                  form.images.map((image) => {
                    return (
                      <div key={image}>
                        <Image src={image} width={200} height={200} />
                        <Button onClick={() => deleteImage(image)}>
                          Delete
                        </Button>
                      </div>
                    );
                  })}
                <div className={classes.desc}>
                  <Textarea
                    label="Description"
                    radius="xl"
                    withAsterisk
                    required
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={classes.topRight}>
                <TextInput
                  label="Name"
                  radius="xl"
                  withAsterisk
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <NumberInput
                  defaultValue={0}
                  min={0}
                  label="Age"
                  description="In years"
                  radius="xl"
                  withAsterisk
                  required
                  value={form.age}
                  onChange={(value) => setForm({ ...form, age: value })}
                />
                <Select
                  label="Species"
                  placeholder="Pick species"
                  searchable
                  data={speciesData}
                  clearable
                  required
                  value={form.species}
                  onChange={(value) => setForm({ ...form, species: value })}
                />
                <TextInput
                  label="Breed"
                  radius="xl"
                  withAsterisk
                  required
                  value={form.breed}
                  onChange={(e) => setForm({ ...form, breed: e.target.value })}
                />
                <NumberInput
                  defaultValue={0}
                  min={0}
                  label="Pet Sitting Duration"
                  description="In days"
                  radius="xl"
                  withAsterisk
                  required
                  value={form.numDays}
                  onChange={(value) => setForm({ ...form, numDays: value })}
                />
                <Select
                  label="Location"
                  placeholder="Pick location"
                  searchable
                  data={locationData}
                  clearable
                  required
                  value={form.location}
                  onChange={(value) => setForm({ ...form, location: value })}
                />
              </div>
            </div>
            <div className={classes.bottomHalf}></div>
          </div>
        </div>
        <div className={classes.buttonContainer}>
          {/* <Button type="submit">Create</Button> */}
          <button className={classes.button} type="submit">
            List my pet!
          </button>
        </div>
      </form>
    </div>
  );
}

const useStyles = createStyles((theme) => ({
  image: {
    width: 200,
  },

  title: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    fontWeight: 600,
  },
  button: {
    backgroundColor: "#D9E7C1",

    padding: "15px 32px",
    borderWidth: 0,
    borderRadius: 50,
  },

  container: {
    backgroundImage: "linear-gradient(to right, #FFEBB9, white)",

    height: "100vh",
  },
  header: {
    fontSize: 30,
    fontWeight: 500,
    display: "flex",
    justifyContent: "center",
    marginTop: "-2%",
    marginBottom: "-1%",
  },
  card: {
    backgroundColor: "white",
    width: "90vw",
    height: "75vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    flexDirection: "column",
    borderRadius: 20,
    borderColor: "#D3D3D3",
    borderWidth: 1,
  },
  topHalf: {
    display: "flex",
    width: "70vw",

    justifyContent: "center",
  },
  topLeft: {
    marginRight: "10%",
    height: "70%",
    width: "50%",
  },
  topRight: { width: "50%", height: "70%" },
  bottomHalf: {},
  cardContainer: {
    display: "flex",
    alignItems: "center",

    justifyContent: "center",
  },
  buttonContainer: {
    marginRight: "5%",
    marginTop: "1%",
    display: "flex",
    justifyContent: "flex-end",
  },
  desc: {
    marginTop: "20%",
  },
}));
