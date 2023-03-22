import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Box,
    AspectRatio,
    Link
} from '@chakra-ui/react'

const VideoModal = (props) => {
    const isOpen = props.isOpen;
    const onClose = props.onClose;

    const formatLinkForEmbed = (url) => {
        if (url) {
            // YouTube URL
            // Taken from https://stackoverflow.com/a/43706989 and converted from Python to Javascript
            if (/(youtube\.com|youtu\.be)/.test(url)) {
                let embedURL = url
                    .replace(/(?:https:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/, "https://www.youtube.com/embed/$1")
                    .replace(/[&?]t=/, "?start=");

                return embedURL;
            }
            // Bilibili URL
            else if (/bilibili\.com/.test(url)) {
                let embedURL = url.replace(/(?:https:\/\/)?(?:www\.)?(?:bilibili\.com)\/(?:video\/)?(.+)/, "//player.bilibili.com/player.html?bvid=$1")
                    .replace(/\/$/, "");

                return embedURL;
            }
            else {
                return url;
            }
        }
        else {
            return url;
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={() => {
            props.setRecordToView(null);

            onClose();
        }
        } size="4xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{props?.trackData?.Name} - {props?.recordToView?.Record} by {props?.recordToView?.Player}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <AspectRatio>
                        <iframe
                            title={`Video for ${props?.trackData?.Name}`}
                            src={formatLinkForEmbed(props?.recordToView?.Video)}
                            allowFullScreen
                        />
                    </AspectRatio>
                    <Box pt={4}>
                        <Link href={props?.recordToView?.Video} isExternal>Click here if the embedded video does not work, or if you want to watch the video at its original location.</Link>
                    </Box>
                </ModalBody>
            </ModalContent>
        </Modal >
    );
}

export default VideoModal;